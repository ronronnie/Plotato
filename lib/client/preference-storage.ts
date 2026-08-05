import { DEFAULT_PREFERENCES, MOCK_RECENT_PAIRINGS } from "@/lib/shared/constants";
import {
  FeedbackRecordListSchema,
  FeedbackRecordSchema,
  RecentPairingListSchema,
  UserPreferencesSchema,
} from "@/lib/shared/schemas";
import type { FeedbackRecord, RecentPairing, UserPreferences } from "@/lib/shared/types";

export const STORAGE_KEYS = {
  preferences: "plotato.preferences.v1",
  feedback: "plotato.feedback.v1",
  recentPairings: "plotato.recentPairings.v1",
} as const;

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function readJson(storage: StorageLike | null, key: string): unknown {
  if (!storage) return undefined;
  const raw = storage.getItem(key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function writeJson(storage: StorageLike | null, key: string, value: unknown) {
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value));
}

export function createMemoryStorage(initial?: Record<string, string>): StorageLike {
  const entries = new Map(Object.entries(initial ?? {}));
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
    },
  };
}

export function createPreferenceStorage(storage: StorageLike | null = getBrowserStorage()) {
  return {
    getPreferences(): UserPreferences {
      return UserPreferencesSchema.parse(readJson(storage, STORAGE_KEYS.preferences));
    },

    savePreferences(preferences: UserPreferences): UserPreferences {
      const parsed = UserPreferencesSchema.parse(preferences);
      writeJson(storage, STORAGE_KEYS.preferences, parsed);
      return parsed;
    },

    updatePreferences(patch: Partial<UserPreferences>): UserPreferences {
      const next = UserPreferencesSchema.parse({ ...this.getPreferences(), ...patch });
      writeJson(storage, STORAGE_KEYS.preferences, next);
      return next;
    },

    markOnboardingComplete(): UserPreferences {
      return this.updatePreferences({ onboardingComplete: true });
    },

    resetPreferences(): UserPreferences {
      writeJson(storage, STORAGE_KEYS.preferences, DEFAULT_PREFERENCES);
      return DEFAULT_PREFERENCES;
    },

    getFeedback(): FeedbackRecord[] {
      return FeedbackRecordListSchema.parse(readJson(storage, STORAGE_KEYS.feedback));
    },

    addFeedback(record: FeedbackRecord): FeedbackRecord[] {
      const parsed = FeedbackRecordSchema.parse(record);
      const next = [parsed, ...this.getFeedback()].slice(0, 50);
      writeJson(storage, STORAGE_KEYS.feedback, next);
      return next;
    },

    getRecentPairings(): RecentPairing[] {
      const stored = RecentPairingListSchema.parse(readJson(storage, STORAGE_KEYS.recentPairings));
      return stored.length > 0 ? stored : MOCK_RECENT_PAIRINGS;
    },

    saveRecentPairings(pairings: RecentPairing[]): RecentPairing[] {
      const parsed = RecentPairingListSchema.parse(pairings).slice(0, 8);
      writeJson(storage, STORAGE_KEYS.recentPairings, parsed);
      return parsed;
    },

    clearAll() {
      storage?.removeItem(STORAGE_KEYS.preferences);
      storage?.removeItem(STORAGE_KEYS.feedback);
      storage?.removeItem(STORAGE_KEYS.recentPairings);
    },
  };
}
