"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/client/analytics";
import { Button } from "@/components/ui/Button";
import { SHARE_CARD_SIZES, generateShareCard, type ShareCardFormat } from "@/lib/client/share-card";
import type { ProcessedImage } from "@/lib/client/image-processing";
import type { Recommendation } from "@/lib/server/recommendation-types";

type ShareSheetProps = {
  recommendation: Recommendation;
  foodName: string;
  processedFoodImage?: ProcessedImage | null;
  onClose: () => void;
};

export function ShareSheet({ recommendation, foodName, processedFoodImage, onClose }: ShareSheetProps) {
  const [format, setFormat] = useState<ShareCardFormat>("story");
  const [includeFoodImage, setIncludeFoodImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const candidate = recommendation.primary.candidate;
  const provider = recommendation.availability.find((item) => item.type === "flatrate" || item.type === "free" || item.type === "ads") ?? recommendation.availability[0];
  const shareUrl = candidate.tmdbUrl;

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function prepareCard() {
    setBusy(true);
    setMessage("");
    try {
      const blob = await generateShareCard({
        format,
        foodName,
        candidate,
        explanation: recommendation.explanation,
        providerName: provider?.name ?? "your watch guide",
        posterUrl: candidate.posterPath ? `https://image.tmdb.org/t/p/w780${candidate.posterPath}` : undefined,
        processedFoodImageUrl: includeFoodImage ? processedFoodImage?.previewUrl : undefined,
      });
      setCardBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      return blob;
    } catch {
      setMessage("Plotato could not draw that card on this device.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void prepareCard(), 0);
    return () => window.clearTimeout(timer);
    // Card generation is intentionally refreshed only when the selected format
    // or explicit food-image opt-in changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, includeFoodImage]);

  async function share() {
    const blob = cardBlob ?? await prepareCard();
    if (!blob) return;
    const file = new File([blob], `plotato-${format}.png`, { type: "image/png" });
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: `Plotato pairing: ${candidate.title}`, text: recommendation.explanation, files: [file], url: shareUrl });
        trackEvent("share_completed", { format, method: "web_share" });
        setMessage("Card shared. Dinner has a press release now.");
        return;
      }
      await copyLink();
    } catch {
      setMessage("Sharing was cancelled. The card is still ready to save.");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      trackEvent("share_completed", { format, method: "copy_link" });
      setMessage("Link copied. Send it with the snack.");
    } catch {
      setMessage(`Copy this link: ${shareUrl}`);
    }
  }

  async function saveImage() {
    const blob = cardBlob ?? await prepareCard();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `plotato-${format}.png`;
    link.click();
    URL.revokeObjectURL(url);
    trackEvent("share_completed", { format, method: "save_image" });
    setMessage("Card saved to this device.");
  }

  function selectFormat(nextFormat: ShareCardFormat) {
    setFormat(nextFormat);
    setCardBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  return (
    <div className="share-backdrop" role="presentation">
      <section className="share-panel" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <header className="share-header">
          <div>
            <p className="eyebrow">Share the pairing</p>
            <h2 id="share-title">Make it a tiny premiere.</h2>
            <p>Cards are generated on this device and are not uploaded.</p>
          </div>
          <Button aria-label="Close share dialog" onClick={onClose} variant="ghost">Close</Button>
        </header>

        <div className="share-format-picker" aria-label="Share card format">
          {(Object.keys(SHARE_CARD_SIZES) as ShareCardFormat[]).map((item) => (
            <button aria-pressed={format === item} className={format === item ? "share-format-selected" : ""} key={item} onClick={() => selectFormat(item)} type="button">
              {SHARE_CARD_SIZES[item].label}<span>{SHARE_CARD_SIZES[item].width} × {SHARE_CARD_SIZES[item].height}</span>
            </button>
          ))}
        </div>

        {processedFoodImage ? (
          <label className="share-photo-option">
            <input checked={includeFoodImage} onChange={(event) => { setIncludeFoodImage(event.target.checked); setCardBlob(null); }} type="checkbox" />
            Include the processed food image
          </label>
        ) : null}
        <p className="share-privacy-note">Your original food photo is never included unless you opt in. Only the processed in-memory image can be used.</p>

        {previewUrl ? (
          // Local blob previews cannot use next/image optimization.
          // eslint-disable-next-line @next/next/no-img-element
          <img className={`share-preview share-preview-${format}`} src={previewUrl} alt={`${SHARE_CARD_SIZES[format].label} share card preview`} />
        ) : <div className="share-preview share-preview-placeholder">{busy ? "Drawing your card..." : "Your card preview appears here."}</div>}

        {message ? <p className="share-message" role="status">{message}</p> : null}
        <div className="share-actions">
          <Button disabled={busy} onClick={() => void share()} variant="primary">Share card</Button>
          <Button disabled={busy} onClick={() => void saveImage()} variant="secondary">Save image</Button>
          <Button onClick={() => void copyLink()} variant="ghost">Copy link</Button>
        </div>
      </section>
    </div>
  );
}
