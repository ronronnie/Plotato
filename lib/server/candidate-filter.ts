import type { FeedbackRecord } from "@/lib/shared/types";
import type { CandidateFilterResult, VerifiedCandidate, ViewingProfile } from "./recommendation-types";

const RECENT_REJECTION_DAYS = 30;

export function filterCandidates(
  candidates: VerifiedCandidate[],
  profile: ViewingProfile,
  feedback: FeedbackRecord[] = [],
  now = new Date(),
): CandidateFilterResult {
  const seenIds = new Set(
    feedback
      .filter((item) => item.action === "seen" || item.action === "watched")
      .map((item) => `${item.mediaType}:${item.tmdbId}`),
  );
  const recentRejectedIds = new Set(
    feedback
      .filter((item) => item.action === "rejected" && isRecent(item.createdAt, now))
      .map((item) => `${item.mediaType}:${item.tmdbId}`),
  );

  let removedForFeedback = 0;
  let removedForProvider = 0;
  let removedForRuntime = 0;
  const filtered = candidates.filter((candidate) => {
    if (candidate.adult || seenIds.has(key(candidate)) || recentRejectedIds.has(key(candidate))) {
      removedForFeedback += 1;
      return false;
    }
    if (profile.mediaPreference !== "mixed" && candidate.mediaType !== (profile.mediaPreference === "movie" ? "movie" : "tv")) {
      removedForRuntime += 1;
      return false;
    }
    if (profile.maximumRuntimeMinutes !== null && candidate.runtimeMinutes !== null && candidate.runtimeMinutes > profile.maximumRuntimeMinutes) {
      removedForRuntime += 1;
      return false;
    }
    if (profile.preferredLanguages.length > 0 && !profile.preferredLanguages.includes(candidate.originalLanguage)) {
      return false;
    }
    if (profile.selectedProviders.length > 0 && !hasSelectedProvider(candidate, profile.selectedProviders)) {
      removedForProvider += 1;
      return false;
    }
    return true;
  });

  return { candidates: filtered, removedForFeedback, removedForProvider, removedForRuntime };
}

function hasSelectedProvider(candidate: VerifiedCandidate, selectedProviders: string[]) {
  const normalized = selectedProviders.map(normalizeProvider);
  return candidate.providers.some((provider) => normalized.includes(normalizeProvider(provider.name)));
}

function normalizeProvider(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").replace("amazonprimevideo", "primevideo");
}

function key(candidate: VerifiedCandidate) {
  return `${candidate.mediaType}:${candidate.id}`;
}

function isRecent(createdAt: string, now: Date) {
  const timestamp = Date.parse(createdAt);
  if (!Number.isFinite(timestamp)) return false;
  return now.getTime() - timestamp <= RECENT_REJECTION_DAYS * 24 * 60 * 60 * 1000;
}
