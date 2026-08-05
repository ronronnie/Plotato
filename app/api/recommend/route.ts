import { z } from "zod";
import { createRecommendation } from "@/lib/server/recommendation-service";
import { FeedbackRecordSchema, UserPreferencesSchema } from "@/lib/shared/schemas";
import { FoodAnalysisSchema } from "@/lib/shared/food-analysis";

const RecommendationRequestSchema = z.object({
  food: FoodAnalysisSchema,
  preferences: UserPreferencesSchema,
  feedback: z.array(FeedbackRecordSchema).default([]),
  mediaPreference: z.enum(["movie", "series", "mixed"]).optional(),
});

export async function POST(request: Request) {
  try {
    const input = RecommendationRequestSchema.parse(await request.json());
    const result = await createRecommendation(input);
    return new Response(JSON.stringify(result), {
      status: result.status === "success" ? 200 : 422,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ status: "failure", failure: { code: "INTERNAL_ERROR", message: "Plotato could not read that meal match." } }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
}
