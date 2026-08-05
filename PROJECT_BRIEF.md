# Plotato Project Brief

## Product Vision

Plotato is a mobile-first web app that helps people decide what to watch based on the food they are about to eat. A user captures or uploads a food photo, the app safely analyses the meal, shows a playful slot-machine loading moment, and returns exactly one movie or TV show recommendation with streaming availability.

The primary promise is simple: help the user start watching something before their food gets cold.

## Problem Statement

Meal-time viewing often turns into browsing, debating, and abandoning options across multiple streaming apps. The decision loop is especially frustrating when the user has limited time, warm food, and no patience for long recommendation lists.

Plotato reduces this decision cost by turning the meal itself into a lightweight recommendation signal and presenting a single confident result.

## Target User

- People who watch movies or TV while eating.
- Users who subscribe to multiple streaming services and struggle to choose quickly.
- Mobile-first users who want a fast, playful decision tool.
- Viewers in India as the MVP default region, with services such as Netflix, Prime Video, and JioHotstar.

## Value Proposition

Plotato replaces endless browsing with a quick, playful match:

- Capture or upload food.
- Let the app infer the meal's mood and viewing constraints.
- Get one real title that is available on the user's selected services.
- Reject, mark as seen, or spin again only when needed.

## Product Principles

- One recommendation at a time.
- Speed over exhaustive choice.
- Food properties over cultural stereotypes.
- Safety and privacy before analysis.
- Region-aware streaming availability.
- No account requirement in the MVP.
- Preferences and feedback remain local by default.
- Do not permanently store uploaded food images.
- Keep API keys and privileged integrations server-side.
- Support accessibility, keyboard use, touch targets, and reduced motion.

## MVP User Journey

1. The user opens Plotato on a mobile device.
2. First-run preferences can be set or skipped:
   - Region, defaulting to India.
   - Streaming services such as Netflix, Prime Video, and JioHotstar.
   - Preferred languages.
   - Typical viewing duration.
3. The home screen asks, "What are we eating today?"
4. The user scans food, uploads a photo, or types the food manually.
5. Uploaded or captured images are validated, stripped of metadata where possible, moderated, and checked for food.
6. Food is converted into structured meal attributes.
7. A playful slot-machine loading experience communicates matching progress.
8. The app retrieves and ranks real TMDb movie and TV candidates with region-aware streaming availability.
9. The app returns one recommendation with metadata and provider availability.
10. The user can watch, mark as seen, reject with a reason, spin again, save locally, or share a recommendation card.

## MVP Scope

- Mobile-first responsive web app.
- Camera capture.
- Image upload.
- Typed-food fallback.
- Image safety moderation.
- Food detection.
- Structured food analysis.
- Playful loading experience.
- Exactly one recommendation at a time.
- Movie and TV metadata from TMDb.
- Region-aware streaming availability.
- Default region: India.
- Streaming services including Netflix, Prime Video, and JioHotstar.
- Seen, reject, save, and spin-again actions.
- Shareable recommendation card.
- Local preference and feedback storage.
- Accessibility and reduced-motion support.

## Out-of-Scope Features

- User accounts.
- Social graph or friend activity.
- Permanent image storage.
- Full recommendation history synced across devices.
- Payment, subscription, or monetisation.
- Provider-specific deep links where unavailable from licensed data.
- Direct JustWatch commercial integration unless licensed separately.
- Editorial reviews, public ratings, or score-heavy result screens.
- A long browsing catalogue.

## Major Edge Cases

- Camera permission denied.
- Poor lighting or blurry image.
- Unsupported file type.
- Oversized image file.
- Unsafe image.
- No food detected.
- Low confidence food detection.
- Typed food contains non-food input.
- No title available on selected services.
- Selected duration excludes all candidates.
- TMDb API failure or rate limit.
- Missing or incomplete streaming provider data.
- User has already seen all strong candidates.
- Reduced-motion user preference.
- Offline or slow network conditions.

## Success Metrics

- Time from app open to recommendation.
- Percentage of sessions that produce a recommendation.
- Percentage of recommendations accepted by provider CTA click.
- Spin-again rate.
- Reject reason distribution.
- Typed-food fallback usage.
- Camera permission failure recovery rate.
- Share card generation and share intent rate.
- Repeat usage on the same device.
- Accessibility and performance scores for mobile.
