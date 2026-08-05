import { describe, expect, it } from "vitest";
import {
  createMemoryStorage,
  createPreferenceStorage,
  STORAGE_KEYS,
} from "@/lib/client/preference-storage";
import { DEFAULT_PREFERENCES } from "@/lib/shared/constants";

describe("preference storage", () => {
  it("returns defaults when storage is empty", () => {
    const storage = createPreferenceStorage(createMemoryStorage());

    expect(storage.getPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("saves and reads validated preferences", () => {
    const memory = createMemoryStorage();
    const storage = createPreferenceStorage(memory);

    storage.savePreferences({
      ...DEFAULT_PREFERENCES,
      region: "GB",
      streamingServices: ["Netflix"],
      languages: ["English"],
      viewingDuration: "quick",
      onboardingComplete: true,
    });

    expect(storage.getPreferences()).toMatchObject({
      region: "GB",
      streamingServices: ["Netflix"],
      viewingDuration: "quick",
      onboardingComplete: true,
    });
  });

  it("falls back to defaults for malformed stored preferences", () => {
    const memory = createMemoryStorage({
      [STORAGE_KEYS.preferences]: JSON.stringify({ viewingDuration: "forever" }),
    });
    const storage = createPreferenceStorage(memory);

    expect(storage.getPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("stores feedback newest first", () => {
    const storage = createPreferenceStorage(createMemoryStorage());

    storage.addFeedback({
      tmdbId: 1,
      mediaType: "movie",
      action: "seen",
      createdAt: "2026-08-05T00:00:00.000Z",
    });
    storage.addFeedback({
      tmdbId: 2,
      mediaType: "tv",
      action: "rejected",
      reason: "too-long",
      createdAt: "2026-08-05T00:01:00.000Z",
    });

    expect(storage.getFeedback().map((record) => record.tmdbId)).toEqual([2, 1]);
  });

  it("uses mock recent pairings until local history exists", () => {
    const storage = createPreferenceStorage(createMemoryStorage());

    expect(storage.getRecentPairings()).toHaveLength(3);

    storage.saveRecentPairings([
      {
        id: "toast-test",
        food: "Toast",
        title: "A Short Episode",
        provider: "Netflix",
        tone: "Quick bite",
        runtime: "18 min",
        accent: "yellow",
      },
    ]);

    expect(storage.getRecentPairings()).toHaveLength(1);
    expect(storage.getRecentPairings()[0]?.food).toBe("Toast");
  });
});
