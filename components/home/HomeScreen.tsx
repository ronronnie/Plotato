"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { PopCard } from "@/components/ui/PopCard";
import { Toast } from "@/components/ui/Toast";
import { createPreferenceStorage } from "@/lib/client/preference-storage";
import { useReducedMotionPreference } from "@/lib/client/motion";
import { trackEvent } from "@/lib/client/analytics";
import { APP_NAME, DEFAULT_PREFERENCES, MOCK_RECENT_PAIRINGS } from "@/lib/shared/constants";
import type { RecentPairing, UserPreferences } from "@/lib/shared/types";
import { PreferencesSheet } from "./PreferencesSheet";
import { RecentPairings } from "./RecentPairings";

type CoreUiState = "idle" | "upload-ready" | "typing" | "loading";

export function HomeScreen() {
  const storage = useMemo(() => createPreferenceStorage(), []);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [recentPairings, setRecentPairings] = useState<RecentPairing[]>(MOCK_RECENT_PAIRINGS);
  const [preferencesOpen, setPreferencesOpen] = useState(true);
  const [foodText, setFoodText] = useState("");
  const [uiState, setUiState] = useState<CoreUiState>("idle");
  const [toast, setToast] = useState("");
  const reduceMotion = useReducedMotionPreference(preferences.reducedMotion);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedPreferences = storage.getPreferences();
      setPreferences(storedPreferences);
      setRecentPairings(storage.getRecentPairings());
      setPreferencesOpen(!storedPreferences.onboardingComplete);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [storage]);

  useEffect(() => {
    trackEvent("home_viewed");
  }, []);

  function savePreferences(nextPreferences = preferences) {
    const saved = storage.savePreferences({ ...nextPreferences, onboardingComplete: true });
    setPreferences(saved);
    setPreferencesOpen(false);
    setToast("Preferences saved on this device.");
  }

  function skipPreferences() {
    const saved = storage.markOnboardingComplete();
    setPreferences(saved);
    setPreferencesOpen(false);
    setToast("Setup skipped. Defaults are ready.");
  }

  function handleUpload(file?: File) {
    if (!file) return;
    setUiState("upload-ready");
    setToast("Photo selected. Safety checks come next.");
  }

  function handleTypedFood() {
    if (!foodText.trim()) {
      setUiState("typing");
      setToast("Type a food first.");
      return;
    }
    window.location.assign(`/scan?food=${encodeURIComponent(foodText.trim())}`);
  }

  return (
    <main className="app-shell">
      <div className="decorative-halftone decorative-halftone-top" aria-hidden="true" />
      <div className="decorative-halftone decorative-halftone-bottom" aria-hidden="true" />

      <header className="mobile-header">
        <button aria-label={APP_NAME} className="logo-placeholder" onClick={() => setPreferencesOpen(true)} type="button">
          <span>PLO</span>
          <strong>TATO</strong>
        </button>
        <IconButton label="Open preferences" onClick={() => setPreferencesOpen(true)}>
          <span aria-hidden="true">P</span>
        </IconButton>
      </header>

      <section className="hero-foundation" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">Food first. One pick. No scroll hole.</p>
          <h1 id="home-title">What are we eating today?</h1>
          <p className="hero-subtitle">Scan your plate and get one movie or TV match before dinner loses steam.</p>

          <div className="hero-actions">
            <Button onClick={() => window.location.assign("/scan")} size="lg" variant="primary">
              Scan my food
            </Button>
            <label className="upload-control">
              Upload a photo
              <input
                accept="image/*"
                className="sr-only"
                type="file"
                onChange={(event) => handleUpload(event.target.files?.[0])}
              />
            </label>
          </div>

          <div className="typed-food-card">
            <label htmlFor="typed-food">Type the food instead</label>
            <div className="typed-food-row">
              <input
                id="typed-food"
                placeholder="Biryani, dosa, ramen..."
                value={foodText}
                onChange={(event) => setFoodText(event.target.value)}
                onFocus={() => setUiState("typing")}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleTypedFood();
                }}
              />
              <Button onClick={handleTypedFood} variant="secondary">
                Match
              </Button>
            </div>
          </div>
        </div>

        <PopCard accent="yellow" className="food-illustration-card">
          <div className="speech-bubble">MATCH?</div>
          <div className="css-food-bowl" aria-hidden="true">
            <span className="food-dot food-dot-red" />
            <span className="food-dot food-dot-green" />
            <span className="food-dot food-dot-pink" />
          </div>
          <div className="mini-slot" aria-hidden={reduceMotion}>
            <LoadingIndicator reducedMotion={reduceMotion} />
          </div>
        </PopCard>
      </section>

      <PopCard accent={uiState === "loading" ? "blue" : "paper"} as="section" className="status-card">
        <p className="eyebrow">Current state</p>
        <h2>{stateCopy[uiState].title}</h2>
        <p>{stateCopy[uiState].body}</p>
      </PopCard>

      <RecentPairings pairings={recentPairings} />

      <PreferencesSheet
        onChange={setPreferences}
        onSave={() => savePreferences()}
        onSkip={skipPreferences}
        open={preferencesOpen}
        preferences={preferences}
      />

      <Toast message={toast} visible={Boolean(toast)} />
    </main>
  );
}

export const stateCopy: Record<CoreUiState, { title: string; body: string }> = {
  idle: {
    title: `Welcome to ${APP_NAME}`,
    body: "Ready for a camera scan, upload, or typed-food fallback.",
  },
  "upload-ready": {
    title: "Photo ready",
    body: "Safety checks come next: validate the file, remove metadata, moderate it, then check for food.",
  },
  typing: {
    title: "Typed fallback",
    body: "Useful when camera permissions, bad lighting, or recognition failures get in the way.",
  },
  loading: {
    title: "Slot machine primed",
    body: "The future recommendation flow will lock taste, energy, and commitment before showing one title.",
  },
};
