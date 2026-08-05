import { createTypedFoodAnalysis, analyzeFoodImage } from "@/lib/server/food-analysis";
import { AnalysisResponseSchema } from "@/lib/shared/food-analysis";
import { logServerError } from "@/lib/server/safe-logging";
import { assertRequestBodySize, enforceRateLimit, getImageRequestLimit, jsonResponse, RateLimitError, readJsonBody, RequestLimitError } from "@/lib/server/request-security";

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "analyze-food", 8, 10 * 60 * 1000);
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      assertRequestBodySize(request, getImageRequestLimit());
      const formData = await request.formData();
      const file = formData.get("image");
      const result = await analyzeFoodImage(file instanceof File ? file : null);
      return jsonResponse(request, AnalysisResponseSchema.parse(result), result.status === "success" ? 200 : 422);
    }

    const payload = await readJsonBody<{ foodText?: string }>(request);
    const foodText = typeof payload.foodText === "string" ? payload.foodText.trim().slice(0, 120) : "";
    if (!foodText) {
      return jsonResponse(request, { status: "invalid_image", message: "Tell Plotato what is on the plate." }, 400);
    }
    return jsonResponse(request, createTypedFoodAnalysis(foodText));
  } catch (error) {
    if (error instanceof RateLimitError) return jsonResponse(request, { status: "provider_error", message: "Plotato needs a tiny breather. Try again shortly." }, 429, { "retry-after": String(error.retryAfterSeconds) });
    if (error instanceof RequestLimitError) return jsonResponse(request, { status: "invalid_image", message: "That request is too large for a tiny food scan." }, 413);
    logServerError("analyze_food_request_error", error);
    return jsonResponse(request, { status: "internal_error", message: "Plotato lost the plot for a second. Try again." }, 500);
  }
}
