import { z } from "zod";
import { ANALYTICS_EVENTS } from "@/lib/client/analytics";
import { logServerError, logServerEvent } from "@/lib/server/safe-logging";
import { enforceRateLimit, jsonResponse, RateLimitError, readJsonBody, RequestLimitError } from "@/lib/server/request-security";

const EventSchema = z.object({
  event: z.enum(ANALYTICS_EVENTS),
  properties: z.record(z.string(), z.union([z.string().max(80), z.number(), z.boolean()])).default({}),
  occurredAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "events", 60, 10 * 60 * 1000);
    const payload = EventSchema.parse(await readJsonBody(request, 8 * 1024));
    logServerEvent("analytics_event", { eventName: payload.event });
    return jsonResponse(request, { ok: true });
  } catch (error) {
    if (error instanceof RateLimitError) return jsonResponse(request, { ok: false }, 429, { "retry-after": String(error.retryAfterSeconds) });
    if (error instanceof RequestLimitError) return jsonResponse(request, { ok: false }, 413);
    logServerError("analytics_event_error", error);
    return jsonResponse(request, { ok: false }, 400);
  }
}
