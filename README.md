# Plotato

Plotato recommends one movie or TV show to match the food you are eating. It is a mobile-first Next.js App Router application running on vinext and Cloudflare-compatible output.

## Local setup

Prerequisite: Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Open the local URL printed by the dev server. Typed food works without provider credentials; image analysis and live TMDb recommendations require the server environment below.

## Environment variables

Create `.env.local` locally. It is ignored by Git. Never use `NEXT_PUBLIC_` for secrets.

```env
OPENAI_API_KEY=replace-me
OPENAI_VISION_MODEL=replace-me
TMDB_READ_ACCESS_TOKEN=replace-me
DEFAULT_WATCH_REGION=IN
OPENAI_RERANK_MODEL=replace-me
FOOD_CONFIDENCE_THRESHOLD=0.65
IMAGE_MAX_BYTES=8388608
NEXT_PUBLIC_APP_URL=http://localhost:3100
```

`OPENAI_API_KEY`, `OPENAI_VISION_MODEL`, `TMDB_READ_ACCESS_TOKEN`, and `OPENAI_RERANK_MODEL` are server-only. Add production values through the hosting provider’s private environment-variable settings, never Git or chat.

## Application surfaces

- `/`: home, onboarding preferences, typed-food entry, local recent pairings.
- `/scan`: camera, gallery, typed-food analysis, recommendation loading, result, feedback, and share cards.
- `/privacy`: MVP data-handling notice and review requirements.
- `/terms`: temporary terms placeholder requiring legal review.
- `/attribution`: TMDb and JustWatch attribution and licensing review notes.

## Security and privacy controls

API routes use server-side rate limits keyed by client IP and a local anonymous identifier, request-size checks, neutral errors, bounded upstream timeouts, and security response headers. The deployed Worker adds CSP, frame, referrer, permissions, and MIME-sniffing protections. Logs pass through `lib/server/safe-logging.ts`; raw images, food text, provider payloads, and API keys are not logged.

Images are re-encoded in the browser, validated again on the server, moderated before analysis, and held only for the request. Preferences, feedback, recent pairings, and the anonymous analytics identifier are local-device data. Share cards are generated in memory and are not uploaded.

Analytics is an internal event abstraction with no vendor hardcoded. Events are sent to `/api/events` and currently logged as allowlisted event names only. Replace the sink behind `lib/client/analytics.ts` if a vendor is selected after privacy review.

## Commands

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

`npm test` runs Vitest unit tests and production render checks. Playwright starts a local dev server and covers the scan, recommendation, error, and share flows.

## Deployment

Build with `npm run build`. Publish the exact pushed commit through the configured Sites project. Set private runtime environment variables in Sites. Verify production headers, API limits, OpenAI/TMDb connectivity, attribution pages, privacy copy, and provider links before opening access.

## Launch-readiness status

The MVP has baseline protections and test coverage, but this is not a claim of full legal, privacy, accessibility, security, or licensing compliance. Before public launch, obtain legal/privacy/licensing review, add durable distributed rate limiting, run a security assessment, validate the hosting CSP against the final deployment, and complete assistive-technology testing.

## Workspace auth

The starter includes optional Dispatch-owned ChatGPT sign-in helpers in `app/chatgpt-auth.ts`. Plotato currently remains anonymous-compatible and does not require accounts. Do not add account-bound behavior without a separate privacy and data-retention decision.
