const defaultReels = [
  ["TASTE", "SPICY", "SWEET"],
  ["ENERGY", "COZY", "CURIOUS"],
  ["22 MIN", "45 MIN", "MOVIE"],
];

type LoadingIndicatorProps = {
  reducedMotion?: boolean;
  reelValues?: [string, string, string];
};

export function LoadingIndicator({ reducedMotion = false, reelValues }: LoadingIndicatorProps) {
  const reels = reelValues
    ? reelValues.map((value, index) => [defaultReels[index]?.[0] ?? "REEL", value, defaultReels[index]?.[2] ?? "READY"])
    : defaultReels;

  return (
    <div className={`loading-indicator ${reducedMotion ? "loading-indicator-static" : ""}`} aria-label="Matching food to a title">
      {reels.map((reel, index) => (
        <div className="loading-reel" key={index}>
          {reel.map((value, valueIndex) => (
            <span key={`${index}-${valueIndex}-${value}`}>{value}</span>
          ))}
        </div>
      ))}
    </div>
  );
}
