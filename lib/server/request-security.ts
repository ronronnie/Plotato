const MAX_IMAGE_REQUEST_BYTES = 8 * 1024 * 1024 + 128 * 1024;
const MAX_JSON_REQUEST_BYTES = 64 * 1024;
const buckets = new Map<string, { count: number; resetAt: number }>();

export class RequestLimitError extends Error {
  constructor(message = "Request body is too large") {
    super(message);
    this.name = "RequestLimitError";
  }
}

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Too many requests");
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function enforceRateLimit(request: Request, bucket: string, limit: number, windowMs: number) {
  const ip = getClientIp(request);
  const anonymousId = sanitizeAnonymousId(request.headers.get("x-plotato-anonymous-id"));
  const now = Date.now();
  const keys = [`${bucket}:ip:${ip}`, `${bucket}:anonymous:${anonymousId}`];
  let retryAfterSeconds = 0;

  for (const key of keys) {
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      continue;
    }
    if (current.count >= limit) {
      retryAfterSeconds = Math.max(retryAfterSeconds, Math.ceil((current.resetAt - now) / 1000));
    } else {
      current.count += 1;
    }
  }

  if (retryAfterSeconds > 0) throw new RateLimitError(retryAfterSeconds);
  pruneBuckets(now);
}

export function assertRequestBodySize(request: Request, maximumBytes: number) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number.isFinite(Number(contentLength)) && Number(contentLength) > maximumBytes) {
    throw new RequestLimitError();
  }
}

export async function readJsonBody<T>(request: Request, maximumBytes = MAX_JSON_REQUEST_BYTES): Promise<T> {
  assertRequestBodySize(request, maximumBytes);
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maximumBytes) throw new RequestLimitError();
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error("Invalid JSON");
  }
}

export function getImageRequestLimit() {
  return MAX_IMAGE_REQUEST_BYTES;
}

export function requestId(request: Request) {
  return request.headers.get("x-request-id")?.slice(0, 80) || globalThis.crypto.randomUUID();
}

export function securityResponseHeaders(request: Request, extra: HeadersInit = {}) {
  const headers = new Headers(extra);
  headers.set("x-request-id", requestId(request));
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(self), microphone=(), geolocation=()");
  headers.set("cross-origin-opener-policy", "same-origin");
  return headers;
}

export function jsonResponse(request: Request, body: unknown, status = 200, extra: HeadersInit = {}) {
  const headers = securityResponseHeaders(request, { "content-type": "application/json; charset=utf-8", ...extra });
  return new Response(JSON.stringify(body), { status, headers });
}

export function rateLimitResponse(request: Request, error: RateLimitError) {
  return jsonResponse(request, { status: "failure", failure: { code: "RATE_LIMITED", message: "Plotato needs a tiny breather. Try again shortly." } }, 429, {
    "retry-after": String(error.retryAfterSeconds),
  });
}

function getClientIp(request: Request) {
  return (request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim().slice(0, 80);
}

function sanitizeAnonymousId(value: string | null) {
  return value && /^[a-zA-Z0-9_-]{8,128}$/.test(value) ? value : "missing";
}

function pruneBuckets(now: number) {
  if (buckets.size < 1000) return;
  for (const [key, entry] of buckets) if (entry.resetAt <= now) buckets.delete(key);
}

export const REQUEST_LIMITS = {
  imageBytes: MAX_IMAGE_REQUEST_BYTES,
  jsonBytes: MAX_JSON_REQUEST_BYTES,
} as const;
