import { describe, expect, it } from "vitest";
import { enforceRateLimit, readJsonBody, RateLimitError, RequestLimitError } from "@/lib/server/request-security";

describe("request security", () => {
  it("limits a repeated anonymous and IP key", () => {
    const request = new Request("https://plotato.test/api", { headers: { "x-plotato-anonymous-id": "security-test-user", "cf-connecting-ip": "192.0.2.10" } });
    enforceRateLimit(request, "unit-security", 1, 60_000);
    expect(() => enforceRateLimit(request, "unit-security", 1, 60_000)).toThrow(RateLimitError);
  });

  it("rejects oversized JSON before parsing", async () => {
    const request = new Request("https://plotato.test/api", { method: "POST", body: JSON.stringify({ text: "x".repeat(100) }) });
    await expect(readJsonBody(request, 16)).rejects.toThrow(RequestLimitError);
  });
});
