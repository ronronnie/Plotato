import { afterEach, describe, expect, it, vi } from "vitest";
import {
  analyzeFoodImage,
  confidenceResponse,
  moderationPolicy,
  parseFoodAnalysis,
  type ModerationResult,
} from "@/lib/server/food-analysis";
import { FoodAnalysisSchema, type FoodAnalysis } from "@/lib/shared/food-analysis";

const baseAnalysis: FoodAnalysis = {
  contains_food: true,
  dish_name: "masala dosa",
  possible_alternatives: ["dosa"],
  meal_type: "breakfast",
  richness: 0.5,
  spiciness: 0.4,
  comfort: 0.8,
  freshness: 0.5,
  playfulness: 0.7,
  intensity: 0.5,
  confidence: 0.8,
};

function imageFile() {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], "food.jpg", { type: "image/jpeg" });
}

function transportFor(vision: FoodAnalysis, moderation: ModerationResult = { flagged: false }) {
  return vi.fn(async (path: string) => {
    if (path === "moderations") return { results: [moderation] };
    return { output_text: JSON.stringify(vision) };
  });
}

afterEach(() => vi.restoreAllMocks());

describe("food analysis contract", () => {
  it("parses strict structured food output with Zod", () => {
    expect(parseFoodAnalysis(JSON.stringify(baseAnalysis))).toEqual(baseAnalysis);
    expect(() => FoodAnalysisSchema.parse({ ...baseAnalysis, confidence: 2 })).toThrow();
  });

  it("rejects flagged and clearly graphic moderation results without exposing categories", () => {
    expect(moderationPolicy({ flagged: true })).toBe("unsafe");
    expect(moderationPolicy({ categories: { "violence/graphic": true } })).toBe("unsafe");
    expect(moderationPolicy({ categories: { sexual: true } })).toBe("unsafe");
    expect(moderationPolicy({ categories: { harassment: true } })).toBe("pass");
  });

  it("returns a confirmation state below the configured confidence threshold", () => {
    const result = confidenceResponse({ ...baseAnalysis, confidence: 0.4 }, 0.65);

    expect(result.status).toBe("low_confidence");
    expect(result).not.toHaveProperty("categories");
  });

  it("returns unsafe_image before sending the image to vision", async () => {
    const transport = transportFor(baseAnalysis, { flagged: true });

    const result = await analyzeFoodImage(imageFile(), transport);

    expect(result.status).toBe("unsafe_image");
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0]?.[0]).toBe("moderations");
  });

  it("returns non_food when the vision response finds no meal", async () => {
    const transport = transportFor({ ...baseAnalysis, contains_food: false, confidence: 0.9 });

    const result = await analyzeFoodImage(imageFile(), transport);

    expect(result.status).toBe("non_food");
  });

  it("returns provider_error when an upstream request times out", async () => {
    const transport = vi.fn(async () => {
      throw new DOMException("The request timed out", "AbortError");
    });

    const result = await analyzeFoodImage(imageFile(), transport);

    expect(result).toEqual({
      status: "provider_error",
      message: "The food scanner hit a tiny speed bump. Try again in a moment.",
    });
  });
});
