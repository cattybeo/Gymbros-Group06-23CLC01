# CONTINUITY.md - Gymbros Project Ledger

## Goal

- Build a robust gym management mobile app (Gymbros) using Expo, Supabase, and Stripe.
- Current Sprint: EPIC v1.4 - Class Detail View & Refinements.

## Constraints/Assumptions

- Framework: Expo SDK 54 (React Native 0.81.5).
- Styling: NativeWind (Tailwind).
- Stripe: Must work on Android (requires returnURL and specific init).
- i18n: Strict usage of `t()` without hardcoded fallbacks or `defaultValue`.

## Key decisions

- Use `initStripe` hook in `membership.tsx`.
- Standardized AI pattern: `@google/genai` (Gemini 3 Flash).
- EPIC v1.4: Use dynamic routing `/class/[id]` for detailed views.
- **Rule of Data Safety**: All mock data scripts must use `status = 'completed'` and be scoped to mock IDs to avoid polluting real user journeys.
- **Rule of Payload Optimization**: Always deduplicate and trim UUID lists before calling AI services.

## State

- Done:
  - Fixed TS/ESLint errors and released v1.3.2.
  - Implemented Class Detail UI & Navigation.
  - Resolved "Booking Pollutant" bug by cleaning up 390+ junk bookings.
  - Fixed Heatmap rendering (timezone & scoring adjustment).
  - Optimized AI Token usage via Unique ID filtering.
  - Implemented `profiles` and `locations` database schema and mock migration.
  - Updated `ClassDetailScreen` to fetch dynamic trainer and location data.
  - Implemented unified roles (`Admin`, `Staff`, `PT`, `Member`) and localized HCMC locations.
  - Fixed `PGRST200` relation error by updating Supabase join syntax to `location:locations(*)`.
  - UI: Enhanced `ClassCard` with location information.
- Now:
  - EPIC v1.4: Refining UI animations and cross-platform consistency.
- Next:
  - Shared Element Transitions between `ClassCard` and `ClassDetail`.
  - Verify trainer/location rendering on physical devices.

## Open questions

- Should we add a share button to the class detail view?

## Working set

- [app/class/[id].tsx](app/class/[id].tsx)
- [components/ClassCard.tsx](components/ClassCard.tsx)
- [app/\_layout.tsx](app/_layout.tsx)
