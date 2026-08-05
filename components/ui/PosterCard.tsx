import type { RecentPairing } from "@/lib/shared/types";

type PosterCardProps = {
  pairing: RecentPairing;
};

export function PosterCard({ pairing }: PosterCardProps) {
  return (
    <article className={`poster-foundation poster-foundation-${pairing.accent}`}>
      <div className="poster-art" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="poster-copy">
        <p>{pairing.food}</p>
        <h3>{pairing.title}</h3>
        <span>
          {pairing.runtime} on {pairing.provider}
        </span>
      </div>
    </article>
  );
}
