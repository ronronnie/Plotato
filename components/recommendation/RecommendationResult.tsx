"use client";

import Link from "next/link";
import { useState } from "react";
import { trackEvent } from "@/lib/client/analytics";
import { Button } from "@/components/ui/Button";
import { StickerChip } from "@/components/ui/StickerChip";
import { ShareSheet } from "./ShareSheet";
import type { Recommendation } from "@/lib/server/recommendation-types";
import type { ProcessedImage } from "@/lib/client/image-processing";

const feedbackOptions = [
  ["already-watched", "Already watched"],
  ["too-long", "Too long"],
  ["wrong-mood", "Wrong mood"],
  ["disliked-genre", "Don't like this genre"],
  ["not-on-platform", "Not on my platform"],
] as const;

type RecommendationResultProps = {
  recommendation: Recommendation;
  feedbackOpen: boolean;
  onOpenFeedback: () => void;
  onSeen: () => void;
  onReject: (reason: (typeof feedbackOptions)[number][0]) => void;
  onSpinAgain: () => void;
  foodName: string;
  processedFoodImage?: ProcessedImage | null;
};

export function RecommendationResult({ recommendation, feedbackOpen, onOpenFeedback, onSeen, onReject, onSpinAgain, foodName, processedFoodImage }: RecommendationResultProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const candidate = recommendation.primary.candidate;
  const provider = recommendation.availability.find((item) => item.type === "flatrate" || item.type === "free" || item.type === "ads") ?? recommendation.availability[0];
  const watchUrl = provider?.link ?? candidate.tmdbUrl;

  return (
    <section className="recommendation-result" aria-labelledby="recommendation-title">
      <div className="result-celebration" aria-hidden="true">
        <span>YES!</span>
        <span>GOOD MATCH</span>
        <span>DINNER + SCREEN</span>
      </div>
      <div className="result-poster-wrap">
        {candidate.posterPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="result-poster" src={`https://image.tmdb.org/t/p/w500${candidate.posterPath}`} alt={`Poster for ${candidate.title}`} />
        ) : (
          <div className="result-poster result-poster-fallback" role="img" aria-label="Illustrated poster placeholder">
            <span>Plotato pick</span>
            <strong>{candidate.title}</strong>
          </div>
        )}
      </div>
      <div className="result-copy">
        <div className="result-meta-row">
          <span className="result-label">{candidate.mediaType === "movie" ? "MOVIE" : "TV SERIES"}</span>
          <span>{formatRuntime(candidate.runtimeMinutes)}</span>
          <span>{formatLanguage(candidate.originalLanguage)}</span>
          {candidate.maturityRating ? <span>{candidate.maturityRating}</span> : null}
        </div>
        <h2 id="recommendation-title">{candidate.title}</h2>
        <p className="result-explanation">{recommendation.explanation}</p>
        <div className="result-tags" aria-label="Match tags">
          {recommendation.primary.matchTags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <div className="result-provider">
          <span className="eyebrow">Watch guide</span>
          <strong>{provider?.name ?? "Availability varies"}</strong>
          <small>{recommendation.attribution.watchProviders}</small>
        </div>
        <div className="result-actions">
          <a className="ui-button ui-button-primary ui-button-lg" href={watchUrl} target="_blank" rel="noreferrer" onClick={() => { trackEvent("provider_clicked", { provider: provider?.name ?? "unknown" }); onSeen(); }}>
            Watch on {provider?.name ?? "TMDb"}
          </a>
          <div className="result-action-row">
            <Button onClick={onSeen} variant="secondary">Seen it</Button>
            <Button onClick={onSpinAgain} variant="ghost">Spin again</Button>
            <Button onClick={() => { trackEvent("share_started", { mediaType: candidate.mediaType }); setShareOpen(true); }} variant="ghost">Share</Button>
          </div>
          <Button aria-expanded={feedbackOpen} onClick={onOpenFeedback} variant="ghost">
            Not feeling this
          </Button>
        </div>
        {feedbackOpen ? (
          <div className="feedback-panel" aria-label="Why not this recommendation?">
            <p className="eyebrow">Tell us why</p>
            <div className="feedback-chips">
              {feedbackOptions.map(([reason, label]) => (
                <StickerChip key={reason} onClick={() => onReject(reason)}>{label}</StickerChip>
              ))}
            </div>
          </div>
        ) : null}
        <Link className="back-to-scan" href="/scan">Back to scan</Link>
      </div>
      {shareOpen ? <ShareSheet foodName={foodName} onClose={() => setShareOpen(false)} processedFoodImage={processedFoodImage} recommendation={recommendation} /> : null}
    </section>
  );
}

function formatRuntime(minutes: number | null) {
  if (!minutes) return "Runtime unknown";
  return `${minutes} min`;
}

function formatLanguage(code: string) {
  const names: Record<string, string> = { en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu", ml: "Malayalam", mr: "Marathi" };
  return names[code] ?? code.toUpperCase();
}
