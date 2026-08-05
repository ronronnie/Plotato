import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { RecommendationFailure as Failure } from "@/lib/server/recommendation-types";

type RecommendationFailureProps = {
  failure: Failure;
  onRetry: () => void;
};

const labels: Record<Failure["code"], { title: string; body: string }> = {
  NETWORK_ERROR: { title: "The signal took a snack break.", body: "Check your connection and try the match again." },
  TMDB_OUTAGE: { title: "The watch guide is taking five.", body: "Plotato could not verify a title right now." },
  NO_MATCHING_PROVIDER: { title: "No clean provider match.", body: "Try another service or let Plotato search wider next time." },
  ALL_SEEN: { title: "You have seen the good stuff.", body: "A fresh spin may find a new corner of the watchlist." },
  NO_CANDIDATES: { title: "This meal needs a wider watchlist.", body: "Try again or tweak your viewing preferences." },
  RATE_LIMITED: { title: "The plot needs a tiny breather.", body: "Wait a moment, then try the match again." },
  INTERNAL_ERROR: { title: "Plotato lost the plot.", body: "Try one more time, or head back for a fresh scan." },
};

export function RecommendationFailure({ failure, onRetry }: RecommendationFailureProps) {
  const copy = labels[failure.code];
  return (
    <section className="recommendation-failure" aria-live="polite">
      <div className="burst burst-red" aria-hidden="true">OOPS!</div>
      <p className="eyebrow">Tiny plot twist</p>
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
      <p className="failure-detail">{failure.message}</p>
      <div className="failure-actions">
        <Button onClick={onRetry} variant="primary">Try again</Button>
        <Link className="back-to-scan" href="/scan">Back to scan</Link>
      </div>
    </section>
  );
}
