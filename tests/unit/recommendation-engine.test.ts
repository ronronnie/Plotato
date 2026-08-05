import { describe, expect, it, vi } from "vitest";
import { createRecommendation } from "@/lib/server/recommendation-service";
import { TmdbError } from "@/lib/server/tmdb-client";
import type { VerifiedCandidate } from "@/lib/server/recommendation-types";
import { candidate, dinnerFood, preferences, provider, snackFood } from "@/tests/fixtures/recommendation-fixtures";

class FakeTmdb {
  constructor(private readonly candidates: VerifiedCandidate[], private readonly outage = false) {}

  async discover(mediaType: "movie" | "tv") {
    if (this.outage) throw new TmdbError("offline");
    return this.candidates.filter((item) => item.mediaType === mediaType).map((item) => ({ id: item.id, media_type: item.mediaType }));
  }

  async getVerifiedCandidate(_mediaType: "movie" | "tv", id: number) {
    return this.candidates.find((item) => item.id === id) ?? null;
  }
}

function service(candidates: VerifiedCandidate[], outage = false) {
  return { tmdb: new FakeTmdb(candidates, outage) as never };
}

describe("recommendation engine", () => {
  it("matches a short snack to a quick television episode", async () => {
    const result = await createRecommendation({ food: snackFood, preferences: preferences({ viewingDuration: "quick" }) }, service([candidate()]));

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.recommendation.primary.candidate.mediaType).toBe("tv");
      expect(result.recommendation.primary.matchTags).toContain("quick bite");
      expect(result.recommendation.explanation.split(" ").length).toBeLessThan(18);
    }
  });

  it("matches a full dinner movie session and returns backups privately", async () => {
    const movies = [
      candidate({ id: 201, mediaType: "movie", title: "Dinner Movie", runtimeMinutes: 115, genres: [18], toneTags: ["cozy", "layered"] }),
      candidate({ id: 202, mediaType: "movie", title: "Dinner Backup", runtimeMinutes: 100 }),
      candidate({ id: 203, mediaType: "movie", title: "Dinner Backup Two", runtimeMinutes: 90 }),
    ];
    const result = await createRecommendation({ food: dinnerFood, preferences: preferences({ viewingDuration: "movie", streamingServices: ["Netflix"] }) }, service(movies));

    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.recommendation.primary.candidate.mediaType).toBe("movie");
      expect(result.recommendation.backups).toHaveLength(2);
      expect(result.recommendation).not.toHaveProperty("candidates");
    }
  });

  it("reports no matching provider", async () => {
    const result = await createRecommendation({ food: snackFood, preferences: preferences({ streamingServices: ["JioHotstar"] }) }, service([candidate()]));

    expect(result).toEqual({ status: "failure", failure: { code: "NO_MATCHING_PROVIDER", message: "No selected service has a clean match yet. Try another provider or spin again." } });
  });

  it("excludes every candidate already seen", async () => {
    const result = await createRecommendation({
      food: snackFood,
      preferences: preferences(),
      feedback: [{ tmdbId: 101, mediaType: "tv", action: "seen", createdAt: "2026-08-05T00:00:00.000Z" }],
    }, service([candidate()]));

    expect(result.status).toBe("failure");
    if (result.status === "failure") expect(result.failure.code).toBe("ALL_SEEN");
  });

  it("honors movie-only and television-only preferences", async () => {
    const options = [candidate({ id: 301 }), candidate({ id: 302, mediaType: "movie", title: "Movie Pick", runtimeMinutes: 100, tmdbUrl: "https://www.themoviedb.org/movie/302" })];
    const movieResult = await createRecommendation({ food: dinnerFood, preferences: preferences({ viewingDuration: "movie" }), mediaPreference: "movie" }, service(options));
    const tvResult = await createRecommendation({ food: snackFood, preferences: preferences({ viewingDuration: "proper" }), mediaPreference: "series" }, service(options));

    expect(movieResult.status === "success" && movieResult.recommendation.primary.candidate.mediaType).toBe("movie");
    expect(tvResult.status === "success" && tvResult.recommendation.primary.candidate.mediaType).toBe("tv");
  });

  it("turns TMDb outages into a neutral failure", async () => {
    const result = await createRecommendation({ food: snackFood, preferences: preferences() }, service([], true));

    expect(result).toEqual({ status: "failure", failure: { code: "TMDB_OUTAGE", message: "Plotato could not reach the watch guide. Try another spin." } });
  });

  it("keeps candidates with missing posters and runtime usable", async () => {
    const result = await createRecommendation({ food: snackFood, preferences: preferences() }, service([candidate({ posterPath: null, runtimeMinutes: null, providers: [provider("Netflix")] })]));

    expect(result.status).toBe("success");
    if (result.status === "success") expect(result.recommendation.primary.candidate.posterPath).toBeNull();
  });

  it("allows AI reranking to reorder only verified candidate IDs", async () => {
    const reranker = vi.fn(async () => [999999, 101]);
    const result = await createRecommendation({ food: snackFood, preferences: preferences() }, { ...service([candidate()]), reranker });

    expect(result.status).toBe("success");
    expect(reranker).toHaveBeenCalled();
    if (result.status === "success") expect(result.recommendation.primary.candidate.id).toBe(101);
  });
});
