# CONTINUITY.md - Gymbros Project Ledger

## Goal

- Build a robust gym management mobile app (Gymbros) using Expo, Supabase, and Stripe.
- Current Sprint: Phase 6 - Logic Cleanup & UI Standardization.
- Objective: Implement Trainer QR Check-out, unify data flow to `profiles` table, and standardize UI notifications with `CustomAlertModal`.

## Constraints/Assumptions

- Framework: Expo SDK 54 (React Native 0.81.5).
- Styling: NativeWind (Tailwind).
- Database: Supabase (`profiles` is canonical, `bookings.status` moves `arrived` -> `completed`).
- AI Standard: Use dedicated Edge Function `gymbros-coach-ai` for Trainer logic.
- i18n: All new strings MUST use `t()` from `trainer` namespace.

## Key decisions

- **QR check-out**: Trainers mark students as `completed` (Check-out) via QR scan. Staff handle Check-in (`arrived`).
- **Metadata Removal**: Stop using `raw_user_meta_data` for application logic to avoid sync issues. Favor `public.profiles`.
- **UI Consistency**: Migrated away from Native `Alert.alert` to `CustomAlertModal` using `useCustomAlert` hook for brand consistency.
- **Onboarding Check**: Simplified `AuthGuard` to verify `body_indices` existence for onboarding status.

## State

- Done:
  - Phase 1-5: Folder structure, Trainer basics, AI integration, Localization.
  - Phase 6:
    - QR Scanning & `completed` status logic.
    - Full migration to `CustomAlertModal` in Trainer and Auth (Google Sign-In).
    - Syncing `profiles` and removing Auth metadata updates.
    - Version bump to 1.8.0 Diamond.
- Now:
  - Ready for final commit/PR.
- Next:
  - Phase 7: Final Demo Production & Test Report.

## Open questions

- (None)

## Working set

- [app/(trainer)/session/[id].tsx](<app/(trainer)/session/[id].tsx>)
- [app/profile/edit.tsx](app/profile/edit.tsx)
- [app/(onboarding)/personal-specs.tsx](<app/(onboarding)/personal-specs.tsx>)
- [components/ui/GoogleSignInButton.tsx](components/ui/GoogleSignInButton.tsx)
- [lib/i18n/locales/vi.json](lib/i18n/locales/vi.json)
- [lib/i18n/locales/en.json](lib/i18n/locales/en.json)
- [package.json](package.json)
- [CHANGELOG.md](CHANGELOG.md)
- [app/profile/settings.tsx](app/profile/settings.tsx)
