import { z } from "zod";
import { createRecommendation } from "@/lib/server/recommendation-service";
import { FeedbackRecordSchema, UserPreferencesSchema } from "@/lib/shared/schemas";
import { FoodAnalysisSchema } from "@/lib/shared/food-analysis";
import { logServerError } from "@/lib/server/safe-logging";
import { enforceRateLimit, jsonResponse, RateLimitError, readJsonBody, RequestLimitError } from "@/lib/server/request-security";

const RecommendationRequestSchema = z.object({
  food: FoodAnalysisSchema,
  preferences: UserPreferencesSchema,
  feedback: z.array(FeedbackRecordSchema).default([]),
  mediaPreference: z.enum(["movie", "series", "mixed"]).optional(),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "recommend", 30, 10 * 60 * 1000);
    const input = RecommendationRequestSchema.parse(await readJsonBody(request));
    const result = await createRecommendation(input);
    return jsonResponse(request, result, result.status === "success" ? 200 : 422);
  } catch (error) {
    if (error instanceof RateLimitError) return jsonResponse(request, { status: "failure", failure: { code: "RATE_LIMITED", message: "Plotato needs a tiny breather. Try again shortly." } }, 429, { "retry-after": String(error.retryAfterSeconds) });
    if (error instanceof RequestLimitError) return jsonResponse(request, { status: "failure", failure: { code: "INVALID_REQUEST", message: "That recommendation request is too large." } }, 413);
    logServerError("recommend_request_error", error);
    return jsonResponse(request, { status: "failure", failure: { code: "INTERNAL_ERROR", message: "Plotato could not read that meal match." } }, 400);
  }
}
