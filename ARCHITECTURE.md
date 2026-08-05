# Plotato Architecture

## Recommended Application Architecture

Plotato should use a Next.js App Router architecture with React, TypeScript strict mode, Tailwind CSS, Framer Motion, Zod, the OpenAI Node SDK, TMDb API integration, Vitest, and Playwright.

The app should keep the browser focused on capture, preference storage, animation, and rendering. Safety checks, food analysis, recommendation ranking, and all API-key usage should run on the server.

## Route Structure

- `/` - Mobile-first home screen, first-run preferences sheet, upload/type entry points, recent pairings.
- `/result/[id]` - Optional future shareable result page if recommendations become persisted or tokenised.
- `/api/analyze-food` - Accepts a temporary image or typed-food payload and returns structured food attributes.
- `/api/recommend` - Converts food attributes and preferences into one recommendation plus server-held backups.
- `/api/share-card` - Optional server-generated share card endpoint.
- `/api/health` - Basic production health check.

## Folder Structure

```text
app/
  layout.tsx
  page.tsx
  api/
    analyze-food/route.ts
    recommend/route.ts
    share-card/route.ts
components/
  ui/
    Button.tsx
    IconButton.tsx
    LoadingIndicator.tsx
    PopCard.tsx
    PosterCard.tsx
    Sheet.tsx
    StickerChip.tsx
    Toast.tsx
  home/
    HomeScreen.tsx
    PreferencesSheet.tsx
    RecentPairings.tsx
lib/
  client/
    preference-storage.ts
    motion.ts
  server/
    image-validation.ts
    moderation.ts
    food-analysis.ts
    recommendation.ts
    tmdb.ts
  shared/
    constants.ts
    schemas.ts
    types.ts
tests/
  unit/
  e2e/
public/
```

## Client and Server Responsibilities

Client responsibilities:

- Render mobile-first UI.
- Manage first-run preferences.
- Capture camera input and uploads.
- Compress images before upload where supported.
- Provide typed-food fallback.
- Store preferences, lightweight feedback, and recent pairings in LocalStorage.
- Respect reduced-motion preferences.

Server responsibilities:

- Validate file type and file size.
- Remove metadata where possible.
- Run image moderation.
- Detect whether an image contains food.
- Convert food into structured attributes.
- Query TMDb and provider availability.
- Rank candidates and return one result.
- Keep API keys private.
- Avoid permanent image storage.

## API Endpoints

### `POST /api/analyze-food`

Input:

- Image upload or typed food.
- Region and user preference hints.

Output:

- `containsFood`
- `dishName`
- `mealType`
- structured attributes
- confidence
- neutral error state when unsafe or invalid

The response is a discriminated union with these statuses: `success`, `unsafe_image`, `non_food`, `low_confidence`, `invalid_image`, `provider_error`, and `internal_error`. Moderation details never cross the API boundary.

### `POST /api/recommend`

Input:

- Food analysis JSON.
- Local preferences.
- Local feedback exclusions.

Output:

- One recommendation.
- Runtime, language, maturity rating, poster/backdrop metadata.
- Available streaming provider.
- Opaque spin-again token or server-side candidate cache in future versions.

### `POST /api/share-card`

Input:

- Recommendation summary and optional cropped food image.

Output:

- Generated story or square share image.

## Image Upload and Compression Flow

1. Browser validates that a file was selected.
2. Browser checks file type and rough size before upload.
3. Browser re-encodes the image to JPEG, resizing and stripping metadata where supported.
4. Server validates final MIME type and byte size again.
5. Server sends the temporary compressed image as a data URL to `omni-moderation-latest`.
6. Clearly unsafe or graphic moderation results return `unsafe_image` with neutral copy; categories are never returned.
7. A configured vision model receives the same temporary image with strict JSON schema output.
8. Zod validates every structured field and rejects malformed provider output.
9. If no food is detected, return `non_food`; if confidence is below threshold, return `low_confidence` for confirmation.
10. The image data URL is cleared in a `finally` block and is never persisted or logged.

## Moderation and Food-Analysis Pipeline

1. Validate file size and type.
2. Run image moderation with `omni-moderation-latest`.
3. If unsafe, return a neutral rejection without detailed categories.
4. Analyse the meal with the server-configured vision model.
5. If no food is detected, return a retry or typed-food fallback state.
6. If confidence is low, ask the user to confirm or edit the dish.
7. Analyse only after moderation passes.

The server uses a 12-second abort timeout and one retry for transient network, 408, 429, and 5xx failures. Logs contain only error type, MIME type, and byte count.

Expected structured output:

```json
{
  "containsFood": true,
  "dishName": "chicken biryani",
  "mealType": "dinner",
  "attributes": {
    "richness": 0.85,
    "spiciness": 0.7,
    "comfort": 0.8,
    "freshness": 0.35,
    "playfulness": 0.5,
    "intensity": 0.75
  },
  "confidence": 0.91
}
```

## Recommendation Pipeline

1. Convert food attributes into a viewing profile.
2. Retrieve real movie and TV candidates from TMDb.
3. Filter by region and selected streaming providers.
4. Apply hard exclusions:
   - Already seen.
   - Rejected titles.
   - Unavailable providers.
   - Unsupported languages.
   - Adult content when disabled.
   - Runtime above selected limit.
5. Rank remaining candidates.
6. Return exactly one winner.
7. Keep backups server-side or recreate them deterministically for spin-again.

Initial ranking weights:

- 35% meal-to-tone match.
- 25% streaming availability.
- 15% preferred runtime.
- 10% language preference.
- 10% prior feedback.
- 5% general content quality.

## TMDb Integration

Use TMDb for:

- Movie and TV search/discover.
- Posters and backdrops.
- Runtime or episode duration.
- Genres.
- Original language.
- Certifications or maturity hints.
- Watch providers by region.

TMDb API calls must happen server-side. Client code must not expose TMDb API keys.

## Streaming-Provider Availability Flow

1. User preferences define selected providers and region.
2. Recommendation service queries TMDb watch-provider data for the candidate title.
3. Candidates unavailable in the selected region or provider set are excluded.
4. MVP displays provider name and a TMDb or JustWatch availability page when direct provider links are unavailable.
5. JustWatch attribution requirements must be respected when using provider data supplied through TMDb.

## LocalStorage Structure

LocalStorage should use a typed abstraction and schema validation.

Suggested keys:

- `plotato.preferences.v1`
- `plotato.feedback.v1`
- `plotato.recentPairings.v1`

Preferences shape:

```ts
type UserPreferences = {
  region: string;
  streamingServices: string[];
  languages: string[];
  viewingDuration: "quick" | "proper" | "movie";
  reducedMotion: "system" | "reduced" | "full";
};
```

Feedback shape:

```ts
type FeedbackRecord = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  action: "seen" | "rejected" | "watched" | "saved";
  reason?: "already-watched" | "too-long" | "wrong-mood" | "disliked-genre" | "not-on-platform";
  createdAt: string;
};
```

## Environment Variables

- `OPENAI_API_KEY` - Server-side OpenAI API key.
- `OPENAI_VISION_MODEL` - Server-side vision model used for structured food analysis.
- `TMDB_API_KEY` - Server-side TMDb API key.
- `NEXT_PUBLIC_APP_URL` - Public site URL for metadata and share links.
- `IMAGE_MAX_BYTES` - Optional image upload limit.
- `FOOD_CONFIDENCE_THRESHOLD` - Optional 0-1 confirmation threshold; defaults to `0.65`.

No secret environment variable should be exposed to browser bundles.

## Privacy and Security Decisions

- No user accounts in the MVP.
- Store preferences and feedback locally.
- Do not permanently store uploaded food images.
- Strip metadata before analysis where possible.
- Run moderation before food analysis.
- Return neutral safety errors without detailed moderation categories.
- Keep API keys server-side.
- Use typed schemas for request and response validation.
- Set `store: false` on vision requests and clear temporary image data after each request.
- Apply request timeouts and bounded retries; never log raw image data or provider payloads.
- Rate limit image-analysis endpoints before production launch.

## Accessibility Approach

- Minimum 44px touch targets.
- Strong color contrast.
- Keyboard-operable controls.
- Semantic buttons and labels.
- Visible focus styles.
- Reduced-motion alternative for slot-machine animation.
- Avoid noisy patterns behind body text.
- Use status regions for loading and toast announcements.

## Testing Strategy

- Vitest unit tests for LocalStorage utilities, schemas, and recommendation helpers.
- Component tests for core UI states where practical.
- API tests for validation and error-state handling.
- Playwright smoke tests for the mobile-first journey.
- Accessibility checks for focus order, labels, reduced motion, and contrast.
- Build, lint, type-check, and tests must pass before deployment.

## Licensing and Attribution Risks

- TMDb data and images require attribution and must follow TMDb terms.
- TMDb watch-provider data is supplied through JustWatch and may require attribution.
- Commercial use should be reviewed before monetisation.
- Do not use copyrighted streaming-service artwork without permission.
- MVP should use provider names as text placeholders unless licensed assets are available.
- Generated or CSS placeholder illustrations should avoid copyrighted characters or brand artwork.
