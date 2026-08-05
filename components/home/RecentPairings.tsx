import { PosterCard } from "@/components/ui/PosterCard";
import type { RecentPairing } from "@/lib/shared/types";

type RecentPairingsProps = {
  pairings: RecentPairing[];
};

export function RecentPairings({ pairings }: RecentPairingsProps) {
  return (
    <section className="recent-pairings" aria-labelledby="recent-pairings-title">
      <div className="section-heading">
        <p className="eyebrow">Local history</p>
        <h2 id="recent-pairings-title">Recent pairings</h2>
      </div>
      <div className="recent-pairing-list">
        {pairings.map((pairing) => (
          <PosterCard key={pairing.id} pairing={pairing} />
        ))}
      </div>
    </section>
  );
}
