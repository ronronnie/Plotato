import type { VerifiedCandidate } from "@/lib/server/recommendation-types";

export const SHARE_CARD_SIZES = {
  story: { width: 1080, height: 1920, label: "Story" },
  square: { width: 1080, height: 1080, label: "Square" },
} as const;

export type ShareCardFormat = keyof typeof SHARE_CARD_SIZES;

export type ShareCardInput = {
  format: ShareCardFormat;
  foodName: string;
  candidate: VerifiedCandidate;
  explanation: string;
  providerName: string;
  posterUrl?: string;
  processedFoodImageUrl?: string;
};

export async function generateShareCard(input: ShareCardInput): Promise<Blob> {
  if (typeof document === "undefined") throw new Error("Share cards require a browser canvas.");

  const size = SHARE_CARD_SIZES[input.format];
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot draw share cards.");

  drawBackground(context, size.width, size.height);
  drawHeader(context, input, size.width);

  const artwork = input.posterUrl
    ? await loadImage(input.posterUrl).catch(() => null)
    : null;
  const foodImage = input.processedFoodImageUrl
    ? await loadImage(input.processedFoodImageUrl).catch(() => null)
    : null;
  const frame = input.format === "story"
    ? { x: 100, y: 525, width: 880, height: 720 }
    : { x: 100, y: 300, width: 880, height: 500 };

  drawArtwork(context, artwork, foodImage, frame, input.candidate.title);
  drawDetails(context, input, size.width, input.format === "story" ? 1330 : 860);
  drawFooter(context, input, size.width, size.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("This browser could not export the share card."));
    }, "image/png");
  });
}

function drawBackground(context: CanvasRenderingContext2D, width: number, height: number) {
  context.fillStyle = "#FFF7E8";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#FFD84D";
  context.fillRect(0, 0, width, Math.round(height * 0.28));
  context.fillStyle = "#161616";
  context.globalAlpha = 0.14;
  for (let x = 36; x < width; x += 28) {
    for (let y = 36; y < height * 0.28; y += 28) context.fillRect(x, y, 5, 5);
  }
  context.globalAlpha = 1;
  drawBurst(context, width - 150, 170, 95, "#F04438");
  drawBurst(context, 120, height - 170, 86, "#B8F04A");
}

function drawHeader(context: CanvasRenderingContext2D, input: ShareCardInput, width: number) {
  context.fillStyle = "#161616";
  context.font = "900 34px Arial, sans-serif";
  context.fillText("PLO", 100, 100);
  context.font = "1000 62px Arial Black, Arial, sans-serif";
  context.fillText("TATO", 165, 105);
  context.font = "1000 72px Arial Black, Arial, sans-serif";
  context.fillText("Tonight's pairing", 100, 225);
  context.font = "900 34px Arial, sans-serif";
  context.fillText(`Food: ${truncate(input.foodName, 34)}`, 100, 290);
  drawSticker(context, width - 250, 75, "MATCH!", "#FF77B7");
}

function drawArtwork(
  context: CanvasRenderingContext2D,
  poster: HTMLImageElement | null,
  foodImage: HTMLImageElement | null,
  frame: { x: number; y: number; width: number; height: number },
  title: string,
) {
  context.fillStyle = "#3559F7";
  context.fillRect(frame.x, frame.y, frame.width, frame.height);
  context.strokeStyle = "#161616";
  context.lineWidth = 10;
  context.strokeRect(frame.x, frame.y, frame.width, frame.height);

  if (poster) {
    drawContain(context, poster, frame.x + 22, frame.y + 22, frame.width - 44, frame.height - 44);
    return;
  }

  if (foodImage) {
    drawCover(context, foodImage, frame.x + 22, frame.y + 22, frame.width - 44, frame.height - 44);
    context.fillStyle = "rgba(22, 22, 22, 0.45)";
    context.fillRect(frame.x + 22, frame.y + 22, frame.width - 44, frame.height - 44);
  }
  context.fillStyle = "#FFD84D";
  context.font = "1000 48px Arial Black, Arial, sans-serif";
  context.fillText("PLOTATO PICK", frame.x + 54, frame.y + 100);
  context.fillStyle = "#FFF7E8";
  context.font = "1000 68px Arial Black, Arial, sans-serif";
  wrapText(context, title, frame.x + 54, frame.y + frame.height - 95, frame.width - 108, 76, 2);
}

function drawDetails(context: CanvasRenderingContext2D, input: ShareCardInput, width: number, top: number) {
  context.fillStyle = "#161616";
  context.font = "1000 68px Arial Black, Arial, sans-serif";
  wrapText(context, input.candidate.title, 100, top, width - 200, 74, 2);
  context.font = "900 34px Arial, sans-serif";
  context.fillText(`${input.candidate.mediaType === "movie" ? "MOVIE" : "TV SERIES"}  •  ${formatRuntime(input.candidate.runtimeMinutes)}`, 100, top + 165);
  context.font = "900 38px Arial, sans-serif";
  wrapText(context, input.explanation, 100, top + 245, width - 200, 48, 3);
  drawSticker(context, 100, top + 410, `WATCH ON ${truncate(input.providerName, 18)}`, "#B8F04A");
}

function drawFooter(context: CanvasRenderingContext2D, input: ShareCardInput, width: number, height: number) {
  context.fillStyle = "#161616";
  context.font = "800 24px Arial, sans-serif";
  context.fillText("TMDb data  •  Watch-provider data supplied by JustWatch", 100, height - 112);
  context.font = "1000 30px Arial Black, Arial, sans-serif";
  context.fillText("PLOTATO", width - 250, height - 112);
  context.font = "700 22px Arial, sans-serif";
  context.fillText("A tiny food-to-watch recommendation", 100, height - 72);
}

function drawContain(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  context.restore();
}

function drawBurst(context: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  context.save();
  context.translate(x, y);
  context.fillStyle = color;
  context.strokeStyle = "#161616";
  context.lineWidth = 7;
  context.beginPath();
  for (let index = 0; index < 20; index += 1) {
    const angle = (Math.PI * 2 * index) / 20;
    const distance = index % 2 === 0 ? radius : radius * 0.58;
    const pointX = Math.cos(angle) * distance;
    const pointY = Math.sin(angle) * distance;
    if (index === 0) context.moveTo(pointX, pointY);
    else context.lineTo(pointX, pointY);
  }
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();
}

function drawSticker(context: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
  context.font = "1000 28px Arial Black, Arial, sans-serif";
  const width = context.measureText(text).width + 48;
  context.fillStyle = color;
  context.strokeStyle = "#161616";
  context.lineWidth = 7;
  context.fillRect(x, y - 42, width, 64);
  context.strokeRect(x, y - 42, width, 64);
  context.fillStyle = "#161616";
  context.fillText(text, x + 24, y);
}

function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((lineText, index) => context.fillText(lineText, x, y + index * lineHeight));
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (!source.startsWith("blob:")) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be loaded."));
    image.src = source;
  });
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function formatRuntime(minutes: number | null) {
  return minutes ? `${minutes} min` : "runtime unknown";
}
