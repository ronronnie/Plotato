const reels = [
  ["TASTE", "SPICY", "SWEET"],
  ["ENERGY", "COZY", "CURIOUS"],
  ["22 MIN", "45 MIN", "MOVIE"],
];

type LoadingIndicatorProps = {
  reducedMotion?: boolean;
};

export function LoadingIndicator({ reducedMotion = false }: LoadingIndicatorProps) {
  return (
    <div className={`loading-indicator ${reducedMotion ? "loading-indicator-static" : ""}`} aria-label="Matching food to a title">
      {reels.map((reel, index) => (
        <div className="loading-reel" key={index}>
          {reel.map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>
      ))}
    </div>
  );
}
