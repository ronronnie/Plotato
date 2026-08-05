import { applySafeReranking, createOpenAiReranker, rankCandidates, type SafeReranker } from "./candidate-ranker";
import { filterCandidates } from "./candidate-filter";
import { foodToViewingProfile } from "./food-to-viewing-profile";
import type { RecommendationInput, RecommendationResponse, ViewingProfile } from "./recommendation-types";
import { TmdbClient, TmdbError } from "./tmdb-client";

export async function createRecommendation(
  input: RecommendationInput,
  dependencies: { tmdb?: TmdbClient; reranker?: SafeReranker; now?: Date } = {},
): Promise<RecommendationResponse> {
  const profile = foodToViewingProfile(input.food, input.preferences, input.mediaPreference);
  const tmdb = dependencies.tmdb ?? new TmdbClient();
  try {
    const mediaTypes = profile.mediaPreference === "movie" ? ["movie"] : profile.mediaPreference === "series" ? ["tv"] : ["movie", "tv"];
    const discovered = (await Promise.all(mediaTypes.map((mediaType) => tmdb.discover(mediaType as "movie" | "tv", {
      withGenres: profile.candidateGenres,
      region: profile.region,
      watchRegion: profile.region || process.env.DEFAULT_WATCH_REGION || "IN",
      maximumRuntimeMinutes: profile.maximumRuntimeMinutes,
    })))).flatMap((items) => items.map((item) => ({ mediaType: mediaTypes.length === 1 ? mediaTypes[0] : item.media_type === "tv" ? "tv" : "movie", id: item.id })).filter((item) => typeof item.id === "number"));

    const verified = (await Promise.all(discovered.slice(0, 24).map((item) => tmdb.getVerifiedCandidate(item.mediaType as "movie" | "tv", item.id as number, profile.region)))).filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));
    const filtered = filterCandidates(verified, profile, input.feedback, dependencies.now);
    if (filtered.candidates.length === 0) return noCandidateFailure(filtered.removedForFeedback > 0 ? "ALL_SEEN" : filtered.removedForProvider > 0 ? "NO_MATCHING_PROVIDER" : "NO_CANDIDATES");
    const ranked = await applySafeReranking(rankCandidates(filtered.candidates, profile, input.food), dependencies.reranker ?? createOpenAiReranker());
    const primary = ranked[0];
    if (!primary) return noCandidateFailure("NO_CANDIDATES");
    return {
      status: "success",
      recommendation: {
        primary: { candidate: primary.candidate, matchScore: primary.score, matchTags: primary.matchTags },
        backups: ranked.slice(1, 3).map((item) => ({ candidate: item.candidate, matchScore: item.score, matchTags: item.matchTags })),
        explanation: explanation(profile, primary.candidate, primary.matchTags),
        availability: primary.candidate.providers,
        attribution: primary.candidate.attribution,
      },
    };
  } catch (error) {
    if (error instanceof TmdbError) return { status: "failure", failure: { code: "TMDB_OUTAGE", message: "Plotato could not reach the watch guide. Try another spin." } };
    return { status: "failure", failure: { code: "INTERNAL_ERROR", message: "Plotato lost the plot while matching your meal." } };
  }
}

function noCandidateFailure(code: "NO_MATCHING_PROVIDER" | "ALL_SEEN" | "NO_CANDIDATES"): RecommendationResponse {
  const messages = {
    NO_MATCHING_PROVIDER: "No selected service has a clean match yet. Try another provider or spin again.",
    ALL_SEEN: "You have already seen the best matches. Time for a brave new spin.",
    NO_CANDIDATES: "Plotato needs a wider watchlist for this meal. Try another spin.",
  } as const;
  return { status: "failure", failure: { code, message: messages[code] } };
}

function explanation(profile: ViewingProfile, candidate: { title: string }, tags: string[]) {
  const tone = tags[0] ?? profile.desiredTones[0] ?? "good vibes";
  const duration = tags.includes("quick bite") ? "quick" : "meal-sized";
  return `${candidate.title} brings ${tone} energy in a ${duration} watch.`.split(" ").slice(0, 17).join(" ");
}

export type { RecommendationInput } from "./recommendation-types";
