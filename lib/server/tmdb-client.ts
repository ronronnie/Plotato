import type { ProviderAvailability, VerifiedCandidate } from "./recommendation-types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const CACHE_TTL_MS = 5 * 60 * 1000;
const responseCache = new Map<string, { expiresAt: number; value: unknown }>();

type TmdbRecord = Record<string, unknown>;
type MediaType = "movie" | "tv";
type TmdbTransport = (url: string, init: RequestInit) => Promise<Response>;

type DiscoverParams = {
  withGenres: number[];
  region: string;
  watchRegion: string;
  maximumRuntimeMinutes: number | null;
};

export class TmdbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TmdbError";
  }
}

export class TmdbClient {
  private readonly transport: TmdbTransport;
  private readonly token: string;

  constructor(token = process.env.TMDB_READ_ACCESS_TOKEN ?? "", transport: TmdbTransport = fetch) {
    this.token = token;
    this.transport = transport;
  }

  async discover(mediaType: MediaType, params: DiscoverParams): Promise<TmdbRecord[]> {
    const search = new URLSearchParams({
      include_adult: "false",
      include_video: "false",
      language: "en-US",
      page: "1",
      region: params.region,
      sort_by: "popularity.desc",
      watch_region: params.watchRegion,
      with_genres: params.withGenres.join("|"),
    });
    if (params.maximumRuntimeMinutes !== null) search.set("with_runtime.lte", String(params.maximumRuntimeMinutes));
    const payload = await this.get(`/discover/${mediaType}?${search.toString()}`);
    return Array.isArray(payload.results) ? payload.results.filter(isRecord) : [];
  }

  async getVerifiedCandidate(mediaType: MediaType, id: number, region: string): Promise<VerifiedCandidate | null> {
    const details = await this.get(`/${mediaType}/${id}?language=en-US&append_to_response=${mediaType === "movie" ? "release_dates" : "content_ratings"}`);
    const providers = await this.get(`/${mediaType}/${id}/watch/providers`);
    return normalizeCandidate(mediaType, details, providers, region);
  }

  private async get(path: string): Promise<TmdbRecord> {
    const cached = responseCache.get(path);
    if (cached && cached.expiresAt > Date.now()) return cached.value as TmdbRecord;
    if (!this.token) throw new TmdbError("TMDB_READ_ACCESS_TOKEN is not configured");
    let response: Response;
    try {
      response = await this.transport(`${TMDB_BASE_URL}${path}`, {
        headers: { accept: "application/json", authorization: `Bearer ${this.token}` },
      });
    } catch {
      throw new TmdbError("TMDb request failed");
    }
    if (!response.ok) throw new TmdbError(`TMDb returned ${response.status}`);
    const payload = await response.json().catch(() => null);
    if (!isRecord(payload)) throw new TmdbError("TMDb returned invalid JSON");
    responseCache.set(path, { expiresAt: Date.now() + CACHE_TTL_MS, value: payload });
    return payload;
  }
}

function normalizeCandidate(mediaType: MediaType, details: TmdbRecord, providersPayload: TmdbRecord, region: string): VerifiedCandidate | null {
  const id = numberValue(details.id);
  const title = stringValue(details.title ?? details.name);
  if (!id || !title) return null;
  const regionData = isRecord(providersPayload.results) && isRecord(providersPayload.results[region]) ? providersPayload.results[region] as TmdbRecord : {};
  const providers = providerList(regionData);
  const runtimeMinutes = mediaType === "movie" ? numberValue(details.runtime) : firstNumber(details.episode_run_time);
  const genres = Array.isArray(details.genres) ? details.genres.map((item) => isRecord(item) ? numberValue(item.id) : null).filter((value): value is number => value !== null) : [];
  return {
    id,
    mediaType,
    title,
    overview: stringValue(details.overview) ?? "",
    genres,
    originalLanguage: stringValue(details.original_language) ?? "",
    runtimeMinutes,
    maturityRating: maturityRating(mediaType, details, region),
    voteAverage: numberValue(details.vote_average) ?? 0,
    voteCount: numberValue(details.vote_count) ?? 0,
    popularity: numberValue(details.popularity) ?? 0,
    adult: details.adult === true,
    posterPath: stringValue(details.poster_path),
    backdropPath: stringValue(details.backdrop_path),
    toneTags: toneTags(genres),
    providers,
    tmdbUrl: `https://www.themoviedb.org/${mediaType}/${id}`,
    attribution: { tmdb: "TMDb", watchProviders: "Streaming data supplied by JustWatch" },
  };
}

function providerList(regionData: TmdbRecord) {
  const lists: Array<[ProviderAvailability["type"], unknown]> = [
    ["flatrate", regionData.flatrate],
    ["free", regionData.free],
    ["ads", regionData.ads],
    ["rent", regionData.rent],
    ["buy", regionData.buy],
  ];
  return lists.flatMap(([type, list]) => Array.isArray(list) ? list.filter(isRecord).flatMap((item) => {
    const providerId = numberValue(item.provider_id);
    const name = stringValue(item.provider_name);
    if (!providerId || !name) return [];
    return [{ providerId, name, logoPath: stringValue(item.logo_path), link: stringValue(regionData.link), type }];
  }) : []);
}

function toneTags(genres: number[]) {
  return [
    ...(genres.includes(35) || genres.includes(16) ? ["playful"] : []),
    ...(genres.includes(10751) || genres.includes(18) ? ["cozy"] : []),
    ...(genres.includes(28) || genres.includes(53) ? ["energizing"] : []),
    ...(genres.includes(14) || genres.includes(12) ? ["bright"] : []),
    ...(genres.includes(80) || genres.includes(9648) ? ["layered"] : []),
  ];
}

function maturityRating(mediaType: MediaType, details: TmdbRecord, region: string) {
  if (mediaType === "movie") {
    const results = isRecord(details.release_dates) && Array.isArray(details.release_dates.results) ? details.release_dates.results : [];
    const regionResult = results.find((item) => isRecord(item) && item.iso_3166_1 === region);
    const releases = regionResult && isRecord(regionResult) && Array.isArray(regionResult.release_dates) ? regionResult.release_dates : [];
    const certification = releases.map((item) => isRecord(item) ? stringValue(item.certification) : null).find(Boolean);
    return certification ?? null;
  }
  const results = isRecord(details.content_ratings) && Array.isArray(details.content_ratings.results) ? details.content_ratings.results : [];
  const regionResult = results.find((item) => isRecord(item) && item.iso_3166_1 === region);
  return regionResult && isRecord(regionResult) ? stringValue(regionResult.rating) : null;
}

function isRecord(value: unknown): value is TmdbRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function stringValue(value: unknown) { return typeof value === "string" && value.length > 0 ? value : null; }
function numberValue(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function firstNumber(value: unknown) { return Array.isArray(value) ? value.find((item): item is number => typeof item === "number" && item > 0) ?? null : null; }
