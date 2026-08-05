type SafeValue = string | number | boolean | null;
type SafeMetadata = Record<string, SafeValue | undefined>;

const SAFE_KEY = /^[a-zA-Z][a-zA-Z0-9_]{0,40}$/;

export function logServerEvent(event: string, metadata: SafeMetadata = {}) {
  const safeMetadata = Object.fromEntries(
    Object.entries(metadata)
      .filter(([key, value]) => SAFE_KEY.test(key) && value !== undefined)
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 120) : value]),
  );
  console.info("Plotato server event", { event: event.slice(0, 80), ...safeMetadata });
}

export function logServerError(event: string, error: unknown, metadata: SafeMetadata = {}) {
  logServerEvent(event, {
    ...metadata,
    errorName: error instanceof Error ? error.name : "unknown",
  });
}
