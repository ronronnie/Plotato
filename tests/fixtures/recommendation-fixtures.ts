import { DEFAULT_PREFERENCES } from "@/lib/shared/constants";
import type { FoodAnalysis } from "@/lib/shared/food-analysis";
import type { UserPreferences } from "@/lib/shared/types";
import type { ProviderAvailability, VerifiedCandidate } from "@/lib/server/recommendation-types";

export const snackFood: FoodAnalysis = {
  contains_food: true,
  dish_name: "samosa",
  possible_alternatives: [],
  meal_type: "snack",
  richness: 0.6,
  spiciness: 0.7,
  comfort: 0.7,
  freshness: 0.3,
  playfulness: 0.8,
  intensity: 0.5,
  confidence: 0.9,
};

export const dinnerFood: FoodAnalysis = {
  ...snackFood,
  dish_name: "biryani",
  meal_type: "dinner",
  richness: 0.9,
  spiciness: 0.6,
  comfort: 0.9,
  playfulness: 0.4,
  intensity: 0.7,
};

export function preferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return { ...DEFAULT_PREFERENCES, ...overrides };
}

export function candidate(overrides: Partial<VerifiedCandidate> = {}): VerifiedCandidate {
  return {
    id: 101,
    mediaType: "tv",
    title: "Snack Time",
    overview: "A warm, funny story.",
    genres: [35, 10751],
    originalLanguage: "en",
    runtimeMinutes: 22,
    voteAverage: 7.5,
    voteCount: 500,
    popularity: 50,
    adult: false,
    posterPath: "/poster.jpg",
    backdropPath: "/backdrop.jpg",
    toneTags: ["playful", "cozy"],
    providers: [provider("Netflix")],
    tmdbUrl: "https://www.themoviedb.org/tv/101",
    attribution: { tmdb: "TMDb", watchProviders: "Streaming data supplied by JustWatch" },
    ...overrides,
  };
}

export function provider(name: string): ProviderAvailability {
  return { providerId: name === "Netflix" ? 8 : 999, name, logoPath: "/logo.jpg", link: "https://www.themoviedb.org", type: "flatrate" };
}
