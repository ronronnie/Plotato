export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const PROCESSED_IMAGE_TYPE = "image/jpeg";
export const PROCESSED_IMAGE_QUALITY = 0.82;
export const MAX_IMAGE_DIMENSION = 1280;

export type ProcessedImage = {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  originalName: string;
};

export type ImageValidationResult =
  | { ok: true }
  | { ok: false; reason: "invalid-format" | "file-too-large"; message: string };

export function validateImageFile(file: File): ImageValidationResult {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return {
      ok: false,
      reason: "invalid-format",
      message: "Use a JPEG, PNG or WebP image.",
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      reason: "file-too-large",
      message: "That image is too large. Choose one under 8 MB.",
    };
  }

  return { ok: true };
}

function getTargetSize(width: number, height: number) {
  const longestSide = Math.max(width, height);
  if (longestSide <= MAX_IMAGE_DIMENSION) return { width, height };

  const scale = MAX_IMAGE_DIMENSION / longestSide;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export async function processImageFile(file: File): Promise<ProcessedImage> {
  const validation = validateImageFile(file);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const target = getTargetSize(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("This browser cannot process images here.");
  }

  context.drawImage(bitmap, 0, 0, target.width, target.height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => {
        if (!nextBlob) {
          reject(new Error("This browser could not prepare the image."));
          return;
        }
        resolve(nextBlob);
      },
      PROCESSED_IMAGE_TYPE,
      PROCESSED_IMAGE_QUALITY,
    );
  });

  return {
    blob,
    previewUrl: URL.createObjectURL(blob),
    width: target.width,
    height: target.height,
    originalName: file.name,
  };
}

export async function processVideoFrame(video: HTMLVideoElement): Promise<ProcessedImage> {
  const width = video.videoWidth || 960;
  const height = video.videoHeight || 1280;
  const target = getTargetSize(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("This browser cannot capture images here.");
  }

  context.drawImage(video, 0, 0, target.width, target.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => {
        if (!nextBlob) {
          reject(new Error("This browser could not prepare the capture."));
          return;
        }
        resolve(nextBlob);
      },
      PROCESSED_IMAGE_TYPE,
      PROCESSED_IMAGE_QUALITY,
    );
  });

  return {
    blob,
    previewUrl: URL.createObjectURL(blob),
    width: target.width,
    height: target.height,
    originalName: "camera-capture.jpg",
  };
}
