"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { RecommendationFailure } from "@/components/recommendation/RecommendationFailure";
import { RecommendationLoading } from "@/components/recommendation/RecommendationLoading";
import { RecommendationResult } from "@/components/recommendation/RecommendationResult";
import { useReducedMotionPreference } from "@/lib/client/motion";
import { trackEvent } from "@/lib/client/analytics";
import { createPreferenceStorage } from "@/lib/client/preference-storage";
import type { AnalysisResponse } from "@/lib/shared/food-analysis";
import type { FeedbackReason } from "@/lib/shared/types";
import type { RecommendationResponse } from "@/lib/server/recommendation-types";
import {
  ACCEPTED_IMAGE_TYPES,
  processImageFile,
  processVideoFrame,
  validateImageFile,
  type ProcessedImage,
} from "@/lib/client/image-processing";

type CameraState =
  | "idle"
  | "starting"
  | "streaming"
  | "captured"
  | "analyzing"
  | "complete"
  | "permission-denied"
  | "no-camera"
  | "unsupported"
  | "in-use"
  | "invalid-file"
  | "file-too-large"
  | "error";

type TorchCapabilities = MediaTrackCapabilities & {
  torch?: boolean;
};

type TorchConstraint = MediaTrackConstraintSet & {
  torch?: boolean;
};

const fallbackCopy: Partial<Record<CameraState, { title: string; body: string }>> = {
  "permission-denied": {
    title: "Camera permission was denied.",
    body: "You can still upload a food photo or type what you are eating.",
  },
  "no-camera": {
    title: "No camera was found.",
    body: "Use gallery upload or the typed-food fallback instead.",
  },
  unsupported: {
    title: "This browser cannot open the camera here.",
    body: "Upload a JPEG, PNG or WebP image to keep going.",
  },
  "in-use": {
    title: "The camera is already in use.",
    body: "Close other camera apps, upload a photo, or type the food.",
  },
  "invalid-file": {
    title: "That file format is not supported.",
    body: "Use a JPEG, PNG or WebP food image.",
  },
  "file-too-large": {
    title: "That image is too large.",
    body: "Choose an image under 8 MB.",
  },
  error: {
    title: "Something blocked the scan.",
    body: "Try again, upload a photo, or type the food.",
  },
};

function mapCameraError(error: unknown): CameraState {
  if (!(error instanceof DOMException)) return "error";
  if (error.name === "NotAllowedError" || error.name === "SecurityError") return "permission-denied";
  if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") return "no-camera";
  if (error.name === "NotReadableError" || error.name === "TrackStartError") return "in-use";
  return "error";
}

function getInitialCameraState(forcedCameraState: string | null): CameraState {
  if (forcedCameraState === "denied") return "permission-denied";
  if (forcedCameraState === "none") return "no-camera";
  if (forcedCameraState === "unsupported") return "unsupported";
  if (forcedCameraState === "in-use") return "in-use";
  return "idle";
}

export function ScanExperience() {
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>(() =>
    getInitialCameraState(searchParams.get("camera")),
  );
  const [capturedImage, setCapturedImage] = useState<ProcessedImage | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [typedFood, setTypedFood] = useState("");
  const [analysisResponse, setAnalysisResponse] = useState<AnalysisResponse | null>(null);
  const [recommendationResponse, setRecommendationResponse] = useState<RecommendationResponse | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const reducedMotion = useReducedMotionPreference("system");
  const recommendationStartedAt = useRef(0);
  const autoSubmittedFood = useRef<string | null>(null);

  const recommendationActive = recommendationLoading || recommendationResponse !== null;

  useEffect(() => {
    return () => {
      stopCamera();
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage.previewUrl);
      }
    };
  }, [capturedImage]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    trackEvent("scan_started");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unsupported");
      return;
    }

    setCameraState("starting");
    setAnalysisResponse(null);
    setRecommendationResponse(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const [track] = stream.getVideoTracks();
      const capabilities = track?.getCapabilities?.() as TorchCapabilities | undefined;
      setTorchSupported(Boolean(capabilities?.torch));
      setCameraState("streaming");
    } catch (error) {
      stopCamera();
      setCameraState(mapCameraError(error));
    }
  }

  async function toggleTorch() {
    const [track] = streamRef.current?.getVideoTracks() ?? [];
    if (!track || !torchSupported) return;
    const next = !torchEnabled;
    await track.applyConstraints({ advanced: [{ torch: next } as TorchConstraint] });
    setTorchEnabled(next);
  }

  async function capturePhoto() {
    if (!videoRef.current) return;
    try {
      const processed = await processVideoFrame(videoRef.current);
      setCapturedImage((previous) => {
        if (previous) URL.revokeObjectURL(previous.previewUrl);
        return processed;
      });
      stopCamera();
      setCameraState("captured");
      trackEvent("image_captured", { source: "camera" });
    } catch {
      setCameraState("error");
    }
  }

  async function handleUpload(file?: File) {
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.ok) {
      setCameraState(validation.reason === "invalid-format" ? "invalid-file" : "file-too-large");
      return;
    }

    try {
      const processed = await processImageFile(file);
      setCapturedImage((previous) => {
        if (previous) URL.revokeObjectURL(previous.previewUrl);
        return processed;
      });
      stopCamera();
      setCameraState("captured");
      trackEvent("image_captured", { source: "gallery" });
      setAnalysisResponse(null);
      setRecommendationResponse(null);
    } catch {
      setCameraState("error");
    }
  }

  async function analyzeImage() {
    if (!capturedImage) return;
    setCameraState("analyzing");
    const formData = new FormData();
    formData.append("image", capturedImage.blob, "plotato-food.jpg");

    try {
      const response = await fetch("/api/analyze-food", { method: "POST", body: formData });
      const payload = (await response.json()) as AnalysisResponse;
      handleAnalysisResponse(payload);
    } catch {
      setAnalysisResponse({ status: "provider_error", message: "The food scanner hit a tiny speed bump. Try again in a moment." });
      setCameraState("complete");
    }
  }

  async function analyzeTypedFood(foodValue = typedFood) {
    const normalizedFood = foodValue.trim();
    if (!normalizedFood) return;
    setCameraState("analyzing");
    try {
      const response = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ foodText: normalizedFood }),
      });
      const payload = (await response.json()) as AnalysisResponse;
      handleAnalysisResponse(payload);
    } catch {
      setAnalysisResponse({ status: "provider_error", message: "The food scanner hit a tiny speed bump. Try again in a moment." });
      setCameraState("complete");
    }
  }

  function handleAnalysisResponse(payload: AnalysisResponse) {
    setAnalysisResponse(payload);
    setCameraState("complete");
    if (payload.status === "success") {
      trackEvent("food_confirmed", { source: capturedImage ? "image" : "typed" });
      void startRecommendation(payload.analysis);
    }
  }

  async function startRecommendation(analysis: NonNullable<Extract<AnalysisResponse, { status: "success" }>['analysis']>) {
    setRecommendationResponse(null);
    setFeedbackOpen(false);
    setRecommendationLoading(true);
    recommendationStartedAt.current = Date.now();
    try {
      const storage = createPreferenceStorage();
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          food: analysis,
          preferences: storage.getPreferences(),
          feedback: storage.getFeedback(),
        }),
      });
      const payload = (await response.json()) as RecommendationResponse;
      await keepLoadingVisible();
      setRecommendationResponse(payload);
      if (payload.status === "success") trackEvent("recommendation_viewed", { mediaType: payload.recommendation.primary.candidate.mediaType });
    } catch {
      await keepLoadingVisible();
      setRecommendationResponse({
        status: "failure",
        failure: { code: "NETWORK_ERROR", message: "Plotato could not reach the recommendation desk." },
      });
    } finally {
      setRecommendationLoading(false);
    }
  }

  async function keepLoadingVisible() {
    const configuredMinimum = Number(process.env.NEXT_PUBLIC_RECOMMENDATION_MIN_LOADING_MS);
    const minimum = Number.isFinite(configuredMinimum) && configuredMinimum >= 0 ? Math.min(configuredMinimum, 800) : 280;
    const remaining = minimum - (Date.now() - recommendationStartedAt.current);
    if (remaining > 0) await new Promise((resolve) => window.setTimeout(resolve, remaining));
  }

  function recordFeedback(action: "seen" | "watched" | "rejected", reason?: FeedbackReason) {
    if (recommendationResponse?.status !== "success") return;
    const { candidate } = recommendationResponse.recommendation.primary;
    createPreferenceStorage().addFeedback({
      tmdbId: candidate.id,
      mediaType: candidate.mediaType,
      action,
      reason,
      createdAt: new Date().toISOString(),
    });
    if (action === "rejected") trackEvent("recommendation_rejected", { reason: reason ?? "unspecified" });
  }

  function handleSeen() {
    recordFeedback("seen");
  }

  function handleReject(reason: FeedbackReason) {
    recordFeedback("rejected", reason);
    setFeedbackOpen(false);
    if (analysisResponse?.status === "success") void startRecommendation(analysisResponse.analysis);
  }

  function handleSpinAgain() {
    recordFeedback("rejected", "wrong-mood");
    if (analysisResponse?.status === "success") void startRecommendation(analysisResponse.analysis);
  }

  useEffect(() => {
    const foodFromHome = searchParams.get("food")?.trim();
    if (!foodFromHome || autoSubmittedFood.current === foodFromHome) return;
    autoSubmittedFood.current = foodFromHome;
    setTypedFood(foodFromHome);
    void analyzeTypedFood(foodFromHome);
    // The ref guard intentionally makes this effect run once per food query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function retake() {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage.previewUrl);
    }
    setCapturedImage(null);
    setAnalysisResponse(null);
    setRecommendationResponse(null);
    setRecommendationLoading(false);
    setFeedbackOpen(false);
    setCameraState("idle");
  }

  const fallback = fallbackCopy[cameraState];

  return (
    <main className="scan-shell">
      <header className="scan-header">
        <Link className="scan-close" href="/" aria-label="Close scanner">
          Close
        </Link>
        <div>
          <p className="eyebrow">Food scan</p>
          <h1>{recommendationActive ? "Your watch match." : "Frame your plate."}</h1>
        </div>
      </header>

      {!recommendationActive ? <>
      <section className="scan-camera-card" aria-label="Camera scanner">
        {cameraState === "streaming" || cameraState === "starting" ? (
          <div className="camera-preview">
            <video ref={videoRef} muted playsInline aria-label="Live camera preview" />
            <div className="camera-frame-guide" aria-hidden="true">
              <span />
              <span />
            </div>
            <p className="privacy-chip">Keep people and private info outside the frame.</p>
          </div>
        ) : null}

        {cameraState === "captured" && capturedImage ? (
          <div className="captured-preview">
            {/* Blob previews are intentionally local object URLs after canvas re-encoding. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Captured food preview" src={capturedImage.previewUrl} />
            <div className="preview-meta">
              <p className="eyebrow">Preview</p>
              <h2>Use this photo?</h2>
              <p>
                Re-encoded to {capturedImage.width} x {capturedImage.height}; metadata was stripped in the browser.
              </p>
            </div>
          </div>
        ) : null}

        {cameraState !== "streaming" && cameraState !== "starting" && cameraState !== "captured" ? (
          <div className="scan-empty-state">
            <div className="camera-illustration" aria-hidden="true">
              <span />
            </div>
            <h2>{fallback?.title ?? "Start with your camera."}</h2>
            <p>{fallback?.body ?? "Camera permission is requested only after you press start."}</p>
          </div>
        ) : null}
      </section>

      <section className="scan-controls" aria-label="Scanner controls">
        {cameraState === "captured" ? (
          <>
            <Button onClick={retake} variant="ghost">
              Retake
            </Button>
            <Button onClick={analyzeImage} variant="primary">
              Use this photo
            </Button>
          </>
        ) : (
          <>
            <Button disabled={cameraState === "starting"} onClick={startCamera} variant="primary">
              {cameraState === "starting" ? "Starting..." : "Start camera"}
            </Button>
            <Button disabled={!torchSupported || cameraState !== "streaming"} onClick={toggleTorch} variant="ghost">
              {torchEnabled ? "Flash on" : "Flash"}
            </Button>
            <label className="upload-control">
              Gallery
              <input
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                className="sr-only"
                type="file"
                onChange={(event) => handleUpload(event.target.files?.[0])}
              />
            </label>
          </>
        )}

        {cameraState === "streaming" ? (
          <IconButton label="Capture food photo" onClick={capturePhoto}>
            <span aria-hidden="true">O</span>
          </IconButton>
        ) : null}
      </section>

      <section className="typed-fallback-card" aria-labelledby="typed-food-title">
        <div>
          <p className="eyebrow">Fallback</p>
          <h2 id="typed-food-title">Type the food instead</h2>
          <p>Use this when lighting, permissions or camera hardware get in the way.</p>
        </div>
        <div className="typed-food-row">
          <input
            aria-label="Food name"
            placeholder="Masala dosa, poha, ramen..."
            value={typedFood}
            onChange={(event) => setTypedFood(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") analyzeTypedFood();
            }}
          />
          <Button onClick={() => void analyzeTypedFood()} variant="secondary">
            Analyze
          </Button>
        </div>
      </section>

      <section className="privacy-note" aria-label="Privacy note">
        <strong>Temporary processing only.</strong>
        <span>Raw food images are prepared in your browser, sent for this analysis step, and are not saved locally.</span>
      </section>

      {cameraState === "analyzing" ? (
        <section className="analysis-card" aria-live="polite">
          <p className="eyebrow">Analysis</p>
          <h2>Checking the plate...</h2>
        </section>
      ) : null}

      {cameraState === "complete" && analysisResponse?.status === "success" ? (
        <section className="analysis-card" aria-live="polite">
          <p className="eyebrow">Analysis ready</p>
          <h2>{analysisResponse.analysis.dish_name}</h2>
          <p>
            Food found. Confidence: {Math.round(analysisResponse.analysis.confidence * 100)}%.
          </p>
        </section>
      ) : null}

      {cameraState === "complete" && analysisResponse?.status === "low_confidence" ? (
        <section className="analysis-card" aria-live="polite">
          <p className="eyebrow">One more look</p>
          <h2>Is this {analysisResponse.analysis.dish_name}?</h2>
          <p>{analysisResponse.message}</p>
        </section>
      ) : null}

      {cameraState === "complete" && analysisResponse && analysisResponse.status !== "success" && analysisResponse.status !== "low_confidence" ? (
        <section className="analysis-card" aria-live="polite">
          <p className="eyebrow">Tiny plot twist</p>
          <h2>{analysisResponse.message}</h2>
        </section>
      ) : null}
      </> : null}

      {recommendationLoading && analysisResponse?.status === "success" ? (
        <RecommendationLoading analysis={analysisResponse.analysis} reducedMotion={reducedMotion} />
      ) : null}

      {!recommendationLoading && recommendationResponse?.status === "success" ? (
        <RecommendationResult
          recommendation={recommendationResponse.recommendation}
          feedbackOpen={feedbackOpen}
          onOpenFeedback={() => setFeedbackOpen(true)}
          onSeen={handleSeen}
          onReject={handleReject}
          onSpinAgain={handleSpinAgain}
          foodName={analysisResponse?.status === "success" ? analysisResponse.analysis.dish_name : "your meal"}
          processedFoodImage={capturedImage}
        />
      ) : null}

      {!recommendationLoading && recommendationResponse?.status === "failure" ? (
        <RecommendationFailure
          failure={recommendationResponse.failure}
          onRetry={() => {
            if (analysisResponse?.status === "success") void startRecommendation(analysisResponse.analysis);
          }}
        />
      ) : null}
    </main>
  );
}
