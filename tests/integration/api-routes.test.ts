import { describe, expect, it } from "vitest";
import { POST as analyzeFood } from "@/app/api/analyze-food/route";
import { POST as recommend } from "@/app/api/recommend/route";

describe("API route integration", () => {
  it("accepts typed food without calling an external provider", async () => {
    const response = await analyzeFood(new Request("https://plotato.test/api/analyze-food", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "192.0.2.20", "x-plotato-anonymous-id": "integration-analyze" },
      body: JSON.stringify({ foodText: "biryani" }),
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect((await response.json()).analysis.dish_name).toBe("biryani");
  });

  it("returns a neutral bad-request response for malformed recommendation input", async () => {
    const response = await recommend(new Request("https://plotato.test/api/recommend", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "192.0.2.21", "x-plotato-anonymous-id": "integration-recommend" },
      body: JSON.stringify({ nope: true }),
    }));
    expect(response.status).toBe(400);
    expect((await response.json()).failure.code).toBe("INTERNAL_ERROR");
  });
});
