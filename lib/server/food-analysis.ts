import {
  FOOD_ANALYSIS_JSON_SCHEMA,
  FoodAnalysisSchema,
  USER_FACING_ANALYSIS_MESSAGES,
  type AnalysisResponse,
  type FoodAnalysis,
} from "@/lib/shared/food-analysis";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/client/image-processing";
import { logServerError } from "./safe-logging";

const MODERATION_MODEL = "omni-moderation-latest";
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_RETRIES = 1;

type JsonRecord = Record<string, unknown>;

type OpenAITransport = (path: string, body: JsonRecord, signal: AbortSignal) => Promise<JsonRecord>;

type ModerationDecision = "pass" | "unsafe";

export type ModerationResult = {
  flagged?: boolean;
  categories?: Record<string, boolean>;
};

export function moderationPolicy(result: ModerationResult): ModerationDecision {
  if (result.flagged) return "unsafe";
  if (result.categories?.["violence/graphic"] || result.categories?.sexual || result.categories?.violence) {
    return "unsafe";
  }
  return "pass";
}

export function parseFoodAnalysis(input: unknown): FoodAnalysis {
  const parsed = typeof input === "string" ? JSON.parse(input) : input;
  return FoodAnalysisSchema.parse(parsed);
}

export function confidenceResponse(analysis: FoodAnalysis, threshold: number): AnalysisResponse {
  if (!analysis.contains_food) {
    return { status: "non_food", message: USER_FACING_ANALYSIS_MESSAGES.non_food };
  }
  if (analysis.confidence < threshold) {
    return {
      status: "low_confidence",
      analysis,
      message: USER_FACING_ANALYSIS_MESSAGES.low_confidence,
    };
  }
  return { status: "success", analysis };
}

export function validateServerImage(file: File | null): AnalysisResponse | null {
  if (!file || !ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return { status: "invalid_image", message: USER_FACING_ANALYSIS_MESSAGES.invalid_image };
  }
  if (file.size > getMaxImageBytes()) {
    return { status: "invalid_image", message: USER_FACING_ANALYSIS_MESSAGES.invalid_image };
  }
  return null;
}

function getMaxImageBytes() {
  const configured = Number(process.env.IMAGE_MAX_BYTES);
  return Number.isFinite(configured) && configured > 0 ? configured : MAX_IMAGE_BYTES;
}

function hasSupportedImageSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  }
  if (type === "image/webp") {
    return ["R", "I", "F", "F", "W", "E", "B", "P"].every((value, index) => bytes[index < 4 ? index : index + 4] === value.charCodeAt(0));
  }
  return false;
}

function getConfidenceThreshold() {
  const configured = Number(process.env.FOOD_CONFIDENCE_THRESHOLD);
  return Number.isFinite(configured) && configured >= 0 && configured <= 1 ? configured : 0.65;
}

function getOpenAITransport(): OpenAITransport {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  return async (path, body, signal) => {
    const response = await fetch(`https://api.openai.com/v1/${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });
    const payload = (await response.json().catch(() => ({}))) as JsonRecord;
    if (!response.ok) {
      const error = new Error(`OpenAI request failed with ${response.status}`) as Error & { retryable?: boolean };
      error.retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      throw error;
    }
    return payload;
  };
}

async function callWithRetry(transport: OpenAITransport, path: string, body: JsonRecord) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await transport(path, body, controller.signal);
    } catch (error) {
      const retryable = error instanceof Error && (error.name === "TypeError" || error.name === "AbortError" || (error as Error & { retryable?: boolean }).retryable);
      if (!retryable || attempt === MAX_RETRIES) throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("OpenAI request failed");
}

function toDataUrl(file: File, bytes: ArrayBuffer) {
  const values = new Uint8Array(bytes);
  let binary = "";
  for (const value of values) binary += String.fromCharCode(value);
  return `data:${file.type};base64,${btoa(binary)}`;
}

function getModerationResult(payload: JsonRecord): ModerationResult {
  const results = Array.isArray(payload.results) ? payload.results : [];
  return (results[0] as ModerationResult | undefined) ?? {};
}

function getVisionText(payload: JsonRecord) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    const contentValue = item && typeof item === "object" ? (item as JsonRecord).content : undefined;
    const content = Array.isArray(contentValue) ? contentValue : [];
    for (const part of content) {
      if (part && typeof part === "object" && typeof (part as JsonRecord).text === "string") return (part as JsonRecord).text;
    }
  }
  throw new Error("Vision response did not include structured output");
}

export async function analyzeFoodImage(file: File | null, transport?: OpenAITransport): Promise<AnalysisResponse> {
  if (!file) return { status: "invalid_image", message: USER_FACING_ANALYSIS_MESSAGES.invalid_image };
  const invalid = validateServerImage(file);
  if (invalid) return invalid;

  let imageDataUrl = "";
  try {
    const requestTransport = transport ?? getOpenAITransport();
    const visionModel = process.env.OPENAI_VISION_MODEL ?? (transport ? "test-vision-model" : "");
    if (!visionModel) throw new Error("OPENAI_VISION_MODEL is not configured");
    const bytes = await file.arrayBuffer();
    if (!hasSupportedImageSignature(file.type, new Uint8Array(bytes))) {
      return { status: "invalid_image", message: USER_FACING_ANALYSIS_MESSAGES.invalid_image };
    }
    imageDataUrl = toDataUrl(file, bytes);

    const moderation = await callWithRetry(requestTransport, "moderations", {
      model: MODERATION_MODEL,
      input: [{ type: "image_url", image_url: { url: imageDataUrl } }],
    });
    if (moderationPolicy(getModerationResult(moderation)) === "unsafe") {
      return { status: "unsafe_image", message: USER_FACING_ANALYSIS_MESSAGES.unsafe_image };
    }

    const vision = await callWithRetry(requestTransport, "responses", {
      model: visionModel,
      store: false,
      max_output_tokens: 600,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Identify the food in this image. Return only the requested structured fields. Be cautious: use contains_food=false when no meal is visible and keep confidence calibrated." },
            { type: "input_image", image_url: imageDataUrl, detail: "low" },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "plotato_food_analysis",
          strict: true,
          schema: FOOD_ANALYSIS_JSON_SCHEMA,
        },
      },
    });

    return confidenceResponse(parseFoodAnalysis(getVisionText(vision)), getConfidenceThreshold());
  } catch (error) {
    logServerError("food_analysis_provider_error", error, {
      mimeType: file.type,
      sizeBytes: file.size,
    });
    return {
      status: "provider_error",
      message: USER_FACING_ANALYSIS_MESSAGES.provider_error,
    };
  } finally {
    imageDataUrl = "";
  }
}

export function createTypedFoodAnalysis(foodText: string): AnalysisResponse {
  const analysis = FoodAnalysisSchema.parse({
    contains_food: true,
    dish_name: foodText.trim(),
    possible_alternatives: [],
    meal_type: "unknown",
    richness: 0.5,
    spiciness: 0.5,
    comfort: 0.7,
    freshness: 0.5,
    playfulness: 0.66,
    intensity: 0.52,
    confidence: 0.76,
  });
  return { status: "success", analysis };
}
