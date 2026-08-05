# Plotato Tasks

Task markers:

- [ ] Pending
- [~] In progress
- [x] Complete

## 1. Project Foundation

- [x] Confirm framework setup with Next.js App Router, React, and TypeScript strict mode.
- [x] Configure Tailwind CSS and global styles.
- [x] Add project metadata for Plotato.
- [x] Define shared product constants.
- [x] Add environment variable documentation.
- [x] Add lint, type-check, and unit test scripts.
- [x] Add end-to-end test script.

## 2. Design System

- [x] Define design tokens for ink, paper, red, yellow, blue, green, and pink.
- [x] Add typography and spacing tokens.
- [x] Build responsive mobile shell capped at an appropriate desktop width.
- [x] Create reusable Button component.
- [x] Create reusable IconButton component.
- [x] Create reusable StickerChip component.
- [x] Create reusable PopCard component.
- [x] Create reusable Sheet component.
- [x] Create reusable Toast component.
- [x] Create reusable LoadingIndicator component.
- [x] Create reusable PosterCard component.
- [x] Add reduced-motion utility and motion preference handling.
- [x] Add placeholder CSS or inline SVG illustrations.

## 3. Home and Onboarding

- [x] Build home screen with product logo placeholder.
- [x] Add "What are we eating today?" headline.
- [x] Add "Scan my food" primary CTA.
- [x] Add upload alternative.
- [x] Add typed-food fallback.
- [x] Add recent-pairings section with mock data.
- [x] Build first-run preferences sheet.
- [x] Add region preference with India as default.
- [x] Add streaming service preference chips including Netflix, Prime Video, and JioHotstar.
- [x] Add language preference chips.
- [x] Add viewing duration preference.
- [x] Add skip action.
- [x] Persist onboarding completion locally.

## 4. Camera and Image Upload

- [x] Build camera capture screen.
- [x] Add custom camera overlay and framing guide.
- [x] Add capture, retake, and continue states.
- [x] Add gallery upload flow.
- [x] Add typed-food fallback from camera failure states.
- [x] Handle camera permission denied.
- [x] Validate file type on the client.
- [x] Validate file size on the client.
- [x] Add browser image compression before upload where supported.

## 5. Moderation and Food Analysis

- [x] Add server-side upload validation.
- [x] Strip metadata in the browser before upload and document the server boundary.
- [x] Add image moderation using OpenAI server-side.
- [x] Return neutral unsafe-image state.
- [x] Add food detection.
- [x] Return no-food-detected state.
- [x] Add low-confidence confirmation state.
- [x] Add structured food-analysis schema with Zod.
- [x] Delete temporary image data after processing.

## 6. Recommendation Engine

- [x] Convert food attributes into viewing profile.
- [x] Add TMDb client wrapper.
- [x] Retrieve real movie and TV candidates from discover endpoints.
- [x] Fetch runtime, genres, language, poster, backdrop, and maturity metadata.
- [x] Fetch region-aware watch-provider availability.
- [x] Filter unavailable providers.
- [x] Filter already-seen and recently rejected titles.
- [x] Filter unsupported languages and adult content.
- [x] Filter by viewing duration.
- [x] Rank candidates using initial weighted formula.
- [x] Return one verified recommendation at a time.
- [x] Keep two verified backup candidates server-side for spin-again.

## 7. Loading and Result Experience

- [x] Build slot-machine loading screen.
- [x] Add taste, energy, and commitment reels.
- [x] Add rotating loading copy.
- [x] Add reduced-motion loading alternative.
- [x] Build result screen with poster or illustrated fallback.
- [x] Show title, media type, runtime, language, and maturity rating when available.
- [x] Show one-sentence food-to-title explanation.
- [x] Show streaming provider availability.
- [x] Add main provider CTA.
- [x] Avoid prominent review scores.

## 8. Feedback and Local History

- [x] Store lightweight positive signal when provider CTA is pressed.
- [x] Add seen action.
- [x] Add reject action.
- [x] Add rejection reason chips.
- [ ] Add save action.
- [x] Store feedback locally with typed abstraction.
- [x] Store recent pairings locally.
- [x] Apply local feedback to future ranking.

## 9. Sharing

- [x] Generate vertical 1080 x 1920 story card locally in the browser.
- [x] Generate square 1080 x 1080 share card locally in the browser.
- [x] Include a CSS-style food illustration fallback and optional processed food image.
- [x] Include poster artwork with preserved aspect ratio or an illustrated fallback.
- [x] Include decorative pop-art halftone and burst elements.
- [x] Include provider text and TMDb/JustWatch attribution.
- [x] Include Plotato logo placeholder and watermark.
- [ ] Add product URL or QR-code placeholder for future use.

## 10. Testing and Production Hardening

- [x] Add unit tests for preference-storage utilities.
- [x] Add unit tests for core UI states.
- [x] Add schema, policy, low-confidence, unsafe-image, non-food, and provider-timeout unit tests with mocked upstream calls.
- [x] Add recommendation ranking and retrieval fixtures for snack, dinner, provider, feedback, media preference, outage, and missing metadata cases.
- [x] Add Playwright coverage for valid image upload, invalid file rejection, permission-denied fallback, and typed-food fallback.
- [x] Add Playwright coverage for mocked recommendation reveal, feedback persistence, network errors, TMDb outages, provider misses, and empty recommendation states.
- [ ] Add accessibility checks.
- [x] Run linting.
- [x] Run type checks.
- [x] Run unit tests.
- [x] Run production build.
- [x] Review API key exposure.
- [x] Review privacy behavior for uploaded images.
- [ ] Review TMDb and JustWatch attribution requirements.

## 11. Launch Readiness

- [x] Add server-side anonymous/IP rate limiting for analysis, recommendations, and analytics intake.
- [x] Add JSON and multipart request-size guards.
- [x] Add production security headers at the Worker boundary.
- [x] Centralize server logging and exclude raw image/provider payloads.
- [x] Add vendor-neutral analytics abstraction and required event names.
- [x] Add privacy, terms placeholder, and attribution pages.
- [x] Add root error boundary, not-found page, and loading UI.
- [x] Add client loading-performance sampling without a hardcoded analytics vendor.
- [x] Add launch README with setup, environment, testing, and deployment instructions.
- [ ] Replace process-local rate limiting with a durable distributed limiter before public launch.
- [ ] Complete legal, privacy, accessibility, security, and licensing review.
- [ ] Run private-beta abuse, load, and assistive-technology testing.

## Completed Work Log

- [x] Scaffolded the mobile-first visual foundation with Plotato metadata, design tokens, responsive shell, reusable UI components, first-run preferences, local preference persistence, mock recent pairings, reduced-motion handling, and unit-test coverage for storage and core UI states.
- [x] Implemented the `/scan` camera and image-selection journey with explicit camera permission request, rear-camera preference, capture preview, flash capability detection, gallery upload, typed-food fallback, client-side image validation, browser re-encoding for compression and metadata stripping, concise privacy copy, and a server-side analysis endpoint.
- [x] Verified the scan journey with four mobile Chromium Playwright tests.
- [x] Replaced the image-analysis mock with server-only OpenAI moderation and vision analysis using strict Zod-validated response states, bounded retries, timeouts, and neutral user-facing errors.
- [x] Added the deterministic TMDb recommendation pipeline with safe AI-assisted reranking limited to verified candidate IDs, regional availability, attribution, filtering, backups, and edge-case fixtures.
- [x] Added the analysis-to-recommendation loading and reveal journey with animated/reduced-motion reels, poster fallback, provider actions, sharing, local feedback, retry handling, and error-state Playwright coverage.
- [x] Added local canvas-generated Story and Square share cards with Web Share, save-image, and copy-link fallbacks. Original food images remain excluded unless the user opts in to using the processed in-memory image.
- [x] Completed a launch-readiness pass covering API protections, safe logging, analytics abstraction, security headers, privacy/terms/attribution surfaces, error handling, performance sampling, README setup, and documented pre-public-launch limitations.
