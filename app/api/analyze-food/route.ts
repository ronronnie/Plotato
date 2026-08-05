import { createTypedFoodAnalysis, analyzeFoodImage } from "@/lib/server/food-analysis";
import { AnalysisResponseSchema } from "@/lib/shared/food-analysis";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image");
      const result = await analyzeFoodImage(file instanceof File ? file : null);
      return jsonResponse(AnalysisResponseSchema.parse(result), result.status === "success" ? 200 : 422);
    }

    const payload = (await request.json().catch(() => null)) as { foodText?: string } | null;
    const foodText = payload?.foodText?.trim();
    if (!foodText) {
      return jsonResponse({ status: "invalid_image", message: "Tell Plotato what is on the plate." }, 400);
    }
    return jsonResponse(createTypedFoodAnalysis(foodText));
  } catch (error) {
    console.error("Plotato analyze-food internal error", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return jsonResponse({ status: "internal_error", message: "Plotato lost the plot for a second. Try again." }, 500);
  }
}
