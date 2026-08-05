export function logClientError(event: string, error: unknown) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ event: "client_error", properties: { source: event.slice(0, 60), errorName: error instanceof Error ? error.name : "unknown" }, occurredAt: new Date().toISOString() });
  void fetch("/api/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => undefined);
}
