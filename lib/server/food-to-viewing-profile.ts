import type { FoodAnalysis } from "@/lib/shared/food-analysis";
import type { UserPreferences } from "@/lib/shared/types";
import type { MediaPreference, ViewingProfile } from "./recommendation-types";

const GENRES = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  mystery: 9648,
  romance: 10749,
  scienceFiction: 878,
  thriller: 53,
} as const;

export function foodToViewingProfile(
  food: FoodAnalysis,
  preferences: UserPreferences,
  mediaPreference: MediaPreference = deriveMediaPreference(preferences.viewingDuration, food.meal_type),
): ViewingProfile {
  const desiredTones = [
    ...(food.comfort >= 0.55 ? ["cozy"] : []),
    ...(food.playfulness >= 0.55 ? ["playful"] : []),
    ...(food.intensity >= 0.6 || food.spiciness >= 0.65 ? ["energizing"] : []),
    ...(food.richness >= 0.65 ? ["layered"] : []),
    ...(food.freshness >= 0.65 ? ["bright"] : []),
  ];

  const candidateGenres = unique([
    ...(food.comfort >= 0.55 ? [GENRES.comedy, GENRES.family, GENRES.drama] : []),
    ...(food.playfulness >= 0.55 ? [GENRES.animation, GENRES.adventure, GENRES.comedy] : []),
    ...(food.intensity >= 0.6 ? [GENRES.action, GENRES.thriller] : []),
    ...(food.richness >= 0.65 ? [GENRES.drama, GENRES.crime, GENRES.mystery] : []),
    ...(food.freshness >= 0.65 ? [GENRES.romance, GENRES.documentary, GENRES.adventure] : []),
  ]);

  return {
    desiredTones: desiredTones.length > 0 ? desiredTones : ["easygoing"],
    candidateGenres: candidateGenres.length > 0 ? candidateGenres : [GENRES.comedy, GENRES.drama],
    avoidedTones: [
      ...(food.freshness < 0.3 ? ["bleak"] : []),
      ...(food.comfort < 0.3 ? ["slow"] : []),
      ...(food.intensity < 0.3 ? ["overwhelming"] : []),
    ],
    maximumRuntimeMinutes: runtimeLimit(preferences.viewingDuration),
    mediaPreference,
    preferredLanguages: preferences.languages.map(languageCode),
    selectedProviders: preferences.streamingServices,
    region: preferences.region || process.env.DEFAULT_WATCH_REGION || "IN",
  };
}

export function deriveMediaPreference(duration: UserPreferences["viewingDuration"], mealType: FoodAnalysis["meal_type"]): MediaPreference {
  if (duration === "movie") return "movie";
  if (duration === "quick" || mealType === "snack") return "series";
  return "mixed";
}

function runtimeLimit(duration: UserPreferences["viewingDuration"]) {
  if (duration === "quick") return 35;
  if (duration === "proper") return 65;
  return null;
}

function unique(values: number[]) {
  return [...new Set(values)];
}

function languageCode(language: string) {
  const codes: Record<string, string> = {
    english: "en",
    hindi: "hi",
    tamil: "ta",
    telugu: "te",
    malayalam: "ml",
    marathi: "mr",
  };
  return codes[language.toLowerCase()] ?? language.toLowerCase();
}
