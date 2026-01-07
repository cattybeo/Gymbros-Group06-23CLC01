# CONTINUITY.md - Gymbros Project Ledger

## Goal

- Build a robust gym management mobile app (Gymbros) using Expo, Supabase, and Stripe.
- Current Sprint: Phase 3 - AI Coach Integration (Trainer Assistant).
- Objective: Implement a Virtual Assistant for Trainers (PT) to analyze class performance and student retention.

## Constraints/Assumptions

- Framework: Expo SDK 54 (React Native 0.81.5).
- Styling: NativeWind (Tailwind); Trainer App uses "Deep Indigo / Dark Teal" palette.
- Database: Supabase (`access_logs`, `bookings` with attendance status).
- AI Standard: Use dedicated Edge Function `gymbros-coach-ai` for Trainer logic.

## Key decisions

- **Separation of Concerns**: `gymbros-ai` remains for Member Class Suggestions. `gymbros-coach-ai` is newly created for Trainer Intelligence.
- **AI Coach Functions**: Class recaps, retention alerts, and smart message drafting.
- **Privacy**: Anonymize student data (IDs/First Names only) before sending to Gemini.

## State

- Done:
  - Phase 1: Refactored Folder Structure (`(auth)`, `(member)`, `(trainer)`).
  - Phase 2: Trainer App Basics (Dashboard, Attendance, Student List).
  - Phase 3: AI Coach Integration (Trainer Assistant) and Member AI refinement.
- Now:
  - Phase 4: Admin Web Console (React).
- Next:
  - Phase 5: Production Hardening & Final Test Report.

## Open questions

- (None)

## Working set

- [app/(trainer)/dashboard.tsx](<app/(trainer)/dashboard.tsx>)
- [app/(trainer)/session/[id].tsx](<app/(trainer)/session/[id].tsx>)
- [supabase/functions/gymbros-coach-ai/index.ts](supabase/functions/gymbros-coach-ai/index.ts)
- [docs_need_to_work/PT_UX_Flow_Plan.md](docs_need_to_work/PT_UX_Flow_Plan.md)
