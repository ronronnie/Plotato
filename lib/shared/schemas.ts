import { z } from "zod";
import { DEFAULT_PREFERENCES } from "./constants";

export const ViewingDurationSchema = z.enum(["quick", "proper", "movie"]);

export const MotionPreferenceSchema = z.enum(["system", "reduced", "full"]);

export const UserPreferencesSchema = z
  .object({
    region: z.string().min(2).default(DEFAULT_PREFERENCES.region),
    streamingServices: z.array(z.string().min(1)).default(DEFAULT_PREFERENCES.streamingServices),
    languages: z.array(z.string().min(1)).default(DEFAULT_PREFERENCES.languages),
    viewingDuration: ViewingDurationSchema.default(DEFAULT_PREFERENCES.viewingDuration),
    reducedMotion: MotionPreferenceSchema.default(DEFAULT_PREFERENCES.reducedMotion),
    onboardingComplete: z.boolean().default(DEFAULT_PREFERENCES.onboardingComplete),
  })
  .catch(DEFAULT_PREFERENCES);

export const FeedbackRecordSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  action: z.enum(["seen", "rejected", "watched", "saved"]),
  reason: z
    .enum(["already-watched", "too-long", "wrong-mood", "disliked-genre", "not-on-platform"])
    .optional(),
  createdAt: z.string().min(1),
});

export const FeedbackRecordListSchema = z.array(FeedbackRecordSchema).catch([]);

export const RecentPairingSchema = z.object({
  id: z.string().min(1),
  food: z.string().min(1),
  title: z.string().min(1),
  provider: z.string().min(1),
  tone: z.string().min(1),
  runtime: z.string().min(1),
  accent: z.enum(["red", "yellow", "blue", "green", "pink"]),
});

export const RecentPairingListSchema = z.array(RecentPairingSchema).catch([]);
