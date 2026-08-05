import { z } from "zod";

export const FoodAnalysisSchema = z.object({
  contains_food: z.boolean(),
  dish_name: z.string().min(1).max(120),
  possible_alternatives: z.array(z.string().min(1).max(120)).max(5),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack", "dessert", "drink", "unknown"]),
  richness: z.number().min(0).max(1),
  spiciness: z.number().min(0).max(1),
  comfort: z.number().min(0).max(1),
  freshness: z.number().min(0).max(1),
  playfulness: z.number().min(0).max(1),
  intensity: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
});

export type FoodAnalysis = z.infer<typeof FoodAnalysisSchema>;

export const AnalysisResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), analysis: FoodAnalysisSchema }),
  z.object({ status: z.literal("unsafe_image"), message: z.string() }),
  z.object({ status: z.literal("non_food"), message: z.string() }),
  z.object({ status: z.literal("low_confidence"), analysis: FoodAnalysisSchema, message: z.string() }),
  z.object({ status: z.literal("invalid_image"), message: z.string() }),
  z.object({ status: z.literal("provider_error"), message: z.string() }),
  z.object({ status: z.literal("internal_error"), message: z.string() }),
]);

export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;

export const FOOD_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "contains_food",
    "dish_name",
    "possible_alternatives",
    "meal_type",
    "richness",
    "spiciness",
    "comfort",
    "freshness",
    "playfulness",
    "intensity",
    "confidence",
  ],
  properties: {
    contains_food: { type: "boolean" },
    dish_name: { type: "string" },
    possible_alternatives: { type: "array", items: { type: "string" }, maxItems: 5 },
    meal_type: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack", "dessert", "drink", "unknown"] },
    richness: { type: "number", minimum: 0, maximum: 1 },
    spiciness: { type: "number", minimum: 0, maximum: 1 },
    comfort: { type: "number", minimum: 0, maximum: 1 },
    freshness: { type: "number", minimum: 0, maximum: 1 },
    playfulness: { type: "number", minimum: 0, maximum: 1 },
    intensity: { type: "number", minimum: 0, maximum: 1 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
} as const;

export const USER_FACING_ANALYSIS_MESSAGES = {
  unsafe_image: "That picture is not a fit for Plotato. Try a food photo instead.",
  non_food: "Plotato could not spot a meal in that frame. Try a closer plate shot or type the food.",
  low_confidence: "Plotato has a hunch, but wants you to double-check the dish.",
  invalid_image: "That image needs a quick retry. Use a JPEG, PNG or WebP under 8 MB.",
  provider_error: "The food scanner hit a tiny speed bump. Try again in a moment.",
  internal_error: "Plotato lost the plot for a second. Try again or type the food instead.",
} as const;
