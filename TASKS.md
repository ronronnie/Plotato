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
- [ ] Add end-to-end test script.

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

- [ ] Build camera capture screen.
- [ ] Add custom camera overlay and framing guide.
- [ ] Add capture, retake, and continue states.
- [ ] Add gallery upload flow.
- [ ] Add typed-food fallback from camera failure states.
- [ ] Handle camera permission denied.
- [ ] Validate file type on the client.
- [ ] Validate file size on the client.
- [ ] Add browser image compression before upload where supported.

## 5. Moderation and Food Analysis

- [ ] Add server-side upload validation.
- [ ] Strip metadata where possible.
- [ ] Add image moderation using OpenAI server-side.
- [ ] Return neutral unsafe-image state.
- [ ] Add food detection.
- [ ] Return no-food-detected state.
- [ ] Add low-confidence confirmation state.
- [ ] Add structured food-analysis schema with Zod.
- [ ] Delete original uploaded image after processing.

## 6. Recommendation Engine

- [ ] Convert food attributes into viewing profile.
- [ ] Add TMDb client wrapper.
- [ ] Retrieve real movie and TV candidates.
- [ ] Fetch runtime, genres, language, poster, backdrop, and maturity metadata.
- [ ] Fetch region-aware watch-provider availability.
- [ ] Filter unavailable providers.
- [ ] Filter already-seen and rejected titles.
- [ ] Filter unsupported languages and adult content.
- [ ] Filter by viewing duration.
- [ ] Rank candidates using initial weighted formula.
- [ ] Return exactly one recommendation at a time.
- [ ] Support spin-again with backup candidates.

## 7. Loading and Result Experience

- [ ] Build slot-machine loading screen.
- [ ] Add taste, energy, and commitment reels.
- [ ] Add rotating loading copy.
- [ ] Add reduced-motion loading alternative.
- [ ] Build result screen with poster or backdrop.
- [ ] Show title, media type, runtime, language, and maturity rating.
- [ ] Show one-sentence food-to-title explanation.
- [ ] Show streaming provider availability.
- [ ] Add main provider CTA.
- [ ] Avoid prominent review scores.

## 8. Feedback and Local History

- [ ] Store lightweight positive signal when provider CTA is pressed.
- [ ] Add seen action.
- [ ] Add reject action.
- [ ] Add rejection reason chips.
- [ ] Add save action.
- [x] Store feedback locally with typed abstraction.
- [x] Store recent pairings locally.
- [ ] Apply local feedback to future ranking.

## 9. Sharing

- [ ] Generate vertical story card.
- [ ] Generate square share card.
- [ ] Include food illustration or cropped food image.
- [ ] Include poster placeholder or licensed poster image.
- [ ] Include comic halftone texture.
- [ ] Include provider text placeholder.
- [ ] Include Plotato watermark.
- [ ] Add product URL or QR-code placeholder for future use.

## 10. Testing and Production Hardening

- [x] Add unit tests for preference-storage utilities.
- [x] Add unit tests for core UI states.
- [ ] Add schema validation tests.
- [ ] Add recommendation ranking tests.
- [ ] Add Playwright smoke test for mobile journey.
- [ ] Add accessibility checks.
- [x] Run linting.
- [x] Run type checks.
- [x] Run unit tests.
- [x] Run production build.
- [ ] Review API key exposure.
- [ ] Review privacy behavior for uploaded images.
- [ ] Review TMDb and JustWatch attribution requirements.

## Completed Work Log

- [x] Scaffolded the mobile-first visual foundation with Plotato metadata, design tokens, responsive shell, reusable UI components, first-run preferences, local preference persistence, mock recent pairings, reduced-motion handling, and unit-test coverage for storage and core UI states.
