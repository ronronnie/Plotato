type MockAnalysisResponse = {
  status: "ready";
  source: "image" | "typed-food";
  dishName: string;
  containsFood: true;
  confidence: number;
  attributes: {
    richness: number;
    spiciness: number;
    comfort: number;
    freshness: number;
    playfulness: number;
    intensity: number;
  };
};

function jsonResponse(body: MockAnalysisResponse | { error: string }, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return jsonResponse({ error: "Missing image." }, 400);
    }

    return jsonResponse({
      status: "ready",
      source: "image",
      dishName: "mock food plate",
      containsFood: true,
      confidence: 0.88,
      attributes: {
        richness: 0.72,
        spiciness: 0.58,
        comfort: 0.8,
        freshness: 0.45,
        playfulness: 0.67,
        intensity: 0.62,
      },
    });
  }

  const payload = (await request.json().catch(() => null)) as { foodText?: string } | null;
  const foodText = payload?.foodText?.trim();
  if (!foodText) {
    return jsonResponse({ error: "Missing typed food." }, 400);
  }

  return jsonResponse({
    status: "ready",
    source: "typed-food",
    dishName: foodText,
    containsFood: true,
    confidence: 0.76,
    attributes: {
      richness: 0.6,
      spiciness: 0.5,
      comfort: 0.7,
      freshness: 0.5,
      playfulness: 0.66,
      intensity: 0.52,
    },
  });
}
