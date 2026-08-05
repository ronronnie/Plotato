import { describe, expect, it, vi } from "vitest";
import { TmdbClient } from "@/lib/server/tmdb-client";

describe("TMDb client", () => {
  it("uses bearer auth, discover filters, and caches public responses", async () => {
    const transport = vi.fn(async (url: string, init: RequestInit) => {
      if (!url || !init) throw new Error("missing request");
      return new Response(JSON.stringify({ results: [{ id: 1, media_type: "movie" }] }), { status: 200, headers: { "content-type": "application/json" } });
    });
    const client = new TmdbClient("tmdb-test-token", transport);
    const params = { withGenres: [35], region: "IN", watchRegion: "IN", maximumRuntimeMinutes: 35 };

    await client.discover("movie", params);
    await client.discover("movie", params);

    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0]?.[0]).toContain("/discover/movie?");
    expect(transport.mock.calls[0]?.[0]).toContain("include_adult=false");
    expect(transport.mock.calls[0]?.[0]).toContain("watch_region=IN");
    expect(transport.mock.calls[0]?.[1].headers).toMatchObject({ authorization: "Bearer tmdb-test-token" });
  });
});
