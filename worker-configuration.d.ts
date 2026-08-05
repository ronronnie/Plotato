interface Fetcher {
  fetch: typeof fetch;
}

interface D1Database {
  prepare?: unknown;
}

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
  };

  export type CloudflareEnv = {
    ASSETS: Fetcher;
    DB?: D1Database;
  };
}
