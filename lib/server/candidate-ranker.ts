import type { FoodAnalysis } from "@/lib/shared/food-analysis";
import { z } from "zod";
import type { RankedCandidate, VerifiedCandidate, ViewingProfile } from "./recommendation-types";

export function rankCandidates(candidates: VerifiedCandidate[], profile: ViewingProfile, food: FoodAnalysis): RankedCandidate[] {
  return candidates
    .map((candidate) => {
      const toneScore = toneMatch(candidate, profile);
      const providerScore = profile.selectedProviders.length === 0 ? 0.7 : providerMatch(candidate, profile);
      const runtimeScore = runtimeFit(candidate.runtimeMinutes, profile.maximumRuntimeMinutes);
      const languageScore = profile.preferredLanguages.length === 0 || profile.preferredLanguages.includes(candidate.originalLanguage) ? 1 : 0;
      const feedbackScore = 0.7;
      const metadataScore = metadataQuality(candidate);
      const score = toneScore * 0.35 + providerScore * 0.25 + runtimeScore * 0.15 + languageScore * 0.1 + feedbackScore * 0.1 + metadataScore * 0.05;
      return { candidate, score, matchTags: buildTags(candidate, profile, food, toneScore, runtimeScore) };
    })
    .sort((a, b) => b.score - a.score || b.candidate.popularity - a.candidate.popularity || a.candidate.id - b.candidate.id);
}

export type SafeReranker = (ranked: RankedCandidate[]) => Promise<number[]>;

export async function applySafeReranking(ranked: RankedCandidate[], reranker?: SafeReranker) {
  if (!reranker) return ranked;
  const verifiedIds = new Set(ranked.map((item) => item.candidate.id));
  const requestedOrder = await reranker(ranked);
  const byId = new Map(ranked.map((item) => [item.candidate.id, item]));
  const ordered = requestedOrder.filter((id) => verifiedIds.has(id)).map((id) => byId.get(id)).filter((item): item is RankedCandidate => Boolean(item));
  const returnedIds = new Set(ordered.map((item) => item.candidate.id));
  return [...ordered, ...ranked.filter((item) => !returnedIds.has(item.candidate.id))];
}

export function createOpenAiReranker(): SafeReranker | undefined {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_RERANK_MODEL ?? process.env.OPENAI_VISION_MODEL;
  if (!apiKey || !model) return undefined;

  return async (ranked) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          store: false,
          input: `Reorder these already verified TMDb candidates for the meal. Return only JSON with ordered_ids, using only the supplied IDs. Candidates: ${JSON.stringify(ranked.slice(0, 12).map(({ candidate, matchTags }) => ({ id: candidate.id, title: candidate.title, overview: candidate.overview.slice(0, 180), tags: matchTags })))} `,
          text: {
            format: {
              type: "json_schema",
              name: "plotato_rerank",
              strict: true,
              schema: { type: "object", additionalProperties: false, required: ["ordered_ids"], properties: { ordered_ids: { type: "array", items: { type: "integer" }, maxItems: 12 } } },
            },
          },
        }),
      });
      if (!response.ok) return [];
      const payload = (await response.json()) as { output_text?: unknown };
      const parsed = z.object({ ordered_ids: z.array(z.number().int()).max(12) }).safeParse(typeof payload.output_text === "string" ? JSON.parse(payload.output_text) : null);
      return parsed.success ? parsed.data.ordered_ids : [];
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  };
}

function toneMatch(candidate: VerifiedCandidate, profile: ViewingProfile) {
  if (candidate.toneTags.some((tag) => profile.avoidedTones.includes(tag))) return 0.15;
  const matches = candidate.toneTags.filter((tag) => profile.desiredTones.includes(tag)).length;
  const genreMatch = candidate.genres.filter((genre) => profile.candidateGenres.includes(genre)).length;
  return Math.min(1, matches / Math.max(1, profile.desiredTones.length) * 0.65 + genreMatch / Math.max(1, profile.candidateGenres.length) * 0.35);
}

function providerMatch(candidate: VerifiedCandidate, profile: ViewingProfile) {
  const names = profile.selectedProviders.map((name) => name.toLowerCase());
  return candidate.providers.some((provider) => names.some((name) => provider.name.toLowerCase().includes(name))) ? 1 : 0;
}

function runtimeFit(runtime: number | null, maximum: number | null) {
  if (runtime === null || maximum === null) return runtime === null ? 0.45 : 0.75;
  if (runtime <= maximum) return 1 - (maximum - runtime) / Math.max(1, maximum * 2);
  return Math.max(0, 1 - (runtime - maximum) / maximum);
}

function metadataQuality(candidate: VerifiedCandidate) {
  return [candidate.overview, candidate.posterPath, candidate.runtimeMinutes, candidate.voteCount > 20].filter(Boolean).length / 4;
}

function buildTags(candidate: VerifiedCandidate, profile: ViewingProfile, food: FoodAnalysis, toneScore: number, runtimeScore: number) {
  return [
    ...(toneScore >= 0.5 ? [profile.desiredTones[0] ?? "good vibes"] : []),
    ...(runtimeScore >= 0.8 ? [food.meal_type === "snack" ? "quick bite" : "meal length"] : []),
    ...(candidate.providers.length > 0 ? ["streaming ready"] : []),
    ...(candidate.posterPath ? [] : ["story first"]),
  ].slice(0, 3);
}
