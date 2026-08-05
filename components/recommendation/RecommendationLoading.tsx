"use client";

import { useEffect, useState } from "react";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import type { FoodAnalysis } from "@/lib/shared/food-analysis";

const messages = [
  "Reading the plate's mood.",
  "Finding something that will not outstay the meal.",
  "Checking the watch guide.",
  "Putting one good pick on the table.",
];

type RecommendationLoadingProps = {
  analysis: FoodAnalysis;
  reducedMotion: boolean;
};

export function RecommendationLoading({ analysis, reducedMotion }: RecommendationLoadingProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const reelValues: [string, string, string] = [
    analysis.spiciness >= 0.65 ? "SPICY" : analysis.freshness >= 0.65 ? "BRIGHT" : "COZY",
    analysis.intensity >= 0.65 ? "BUZZY" : analysis.playfulness >= 0.65 ? "PLAYFUL" : "EASY",
    analysis.meal_type === "snack" ? "22 MIN" : analysis.meal_type === "dessert" ? "SWEET" : "MEAL-SIZED",
  ];

  useEffect(() => {
    if (reducedMotion) return;
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 1500);
    return () => window.clearInterval(interval);
  }, [reducedMotion]);

  return (
    <section className="recommendation-loading" aria-live="polite" aria-label="Finding one recommendation">
      <div className="burst burst-yellow" aria-hidden="true">SPIN!</div>
      <p className="eyebrow">Plotato is on it</p>
      <h2>One tasty match, coming up.</h2>
      <LoadingIndicator reducedMotion={reducedMotion} reelValues={reelValues} />
      {reducedMotion ? (
        <ol className="loading-steps">
          <li className="loading-step-complete">Taste profile ready</li>
          <li className="loading-step-active">Checking verified titles</li>
          <li>Picking the cleanest match</li>
        </ol>
      ) : (
        <p className="loading-message">{messages[messageIndex]}</p>
      )}
      <p className="loading-note">No fake titles. Every pick is checked against the watch guide.</p>
    </section>
  );
}
