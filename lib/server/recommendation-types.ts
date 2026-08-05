import type { FeedbackRecord, UserPreferences } from "@/lib/shared/types";
import type { FoodAnalysis } from "@/lib/shared/food-analysis";

export type MediaPreference = "movie" | "series" | "mixed";

export type ViewingProfile = {
  desiredTones: string[];
  candidateGenres: number[];
  avoidedTones: string[];
  maximumRuntimeMinutes: number | null;
  mediaPreference: MediaPreference;
  preferredLanguages: string[];
  selectedProviders: string[];
  region: string;
};

export type RecommendationInput = {
  food: FoodAnalysis;
  preferences: UserPreferences;
  feedback?: FeedbackRecord[];
  mediaPreference?: MediaPreference;
};

export type ProviderAvailability = {
  providerId: number;
  name: string;
  logoPath: string | null;
  link: string | null;
  type: "flatrate" | "free" | "ads" | "rent" | "buy";
};

export type VerifiedCandidate = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  overview: string;
  genres: number[];
  originalLanguage: string;
  runtimeMinutes: number | null;
  maturityRating: string | null;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  adult: boolean;
  posterPath: string | null;
  backdropPath: string | null;
  toneTags: string[];
  providers: ProviderAvailability[];
  tmdbUrl: string;
  attribution: {
    tmdb: string;
    watchProviders: string;
  };
};

export type RankedCandidate = {
  candidate: VerifiedCandidate;
  score: number;
  matchTags: string[];
};

export type Recommendation = {
  primary: {
    candidate: VerifiedCandidate;
    matchScore: number;
    matchTags: string[];
  };
  backups: Array<{
    candidate: VerifiedCandidate;
    matchScore: number;
    matchTags: string[];
  }>;
  explanation: string;
  availability: ProviderAvailability[];
  attribution: VerifiedCandidate["attribution"];
};

export type RecommendationFailure = {
  code: "NO_MATCHING_PROVIDER" | "ALL_SEEN" | "NO_CANDIDATES" | "TMDB_OUTAGE" | "NETWORK_ERROR" | "INTERNAL_ERROR";
  message: string;
};

export type RecommendationResponse =
  | { status: "success"; recommendation: Recommendation }
  | { status: "failure"; failure: RecommendationFailure };

export type CandidateFilterResult = {
  candidates: VerifiedCandidate[];
  removedForFeedback: number;
  removedForProvider: number;
  removedForRuntime: number;
};
