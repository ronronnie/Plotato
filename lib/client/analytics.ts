export const ANALYTICS_EVENTS = [
  "home_viewed",
  "scan_started",
  "image_captured",
  "food_confirmed",
  "recommendation_viewed",
  "recommendation_rejected",
  "provider_clicked",
  "share_started",
  "share_completed",
  "performance_sample",
  "client_error",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];
export type AnalyticsProperties = Record<string, string | number | boolean | undefined>;

const ANONYMOUS_ID_KEY = "plotato.analytics.anonymousId.v1";

export function trackEvent(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ event, properties: sanitizeProperties(properties), occurredAt: new Date().toISOString() });
  const headers = { "content-type": "application/json", "x-plotato-anonymous-id": getAnonymousId() };
  void fetch("/api/events", { method: "POST", body, headers, keepalive: true }).catch(() => undefined);
}

function getAnonymousId() {
  try {
    const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,128}$/.test(existing)) return existing;
    const next = globalThis.crypto.randomUUID().replaceAll("-", "");
    window.localStorage.setItem(ANONYMOUS_ID_KEY, next);
    return next;
  } catch {
    return "browser-session";
  }
}

function sanitizeProperties(properties: AnalyticsProperties) {
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([key, value]) => /^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(key) && value !== undefined)
      .slice(0, 12)
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 80) : value]),
  );
}
