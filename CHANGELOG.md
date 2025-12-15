# Changelog

All notable changes to the "Gymbros" project will be documented in this file.

## [v0.4.0] - 2025-12-15

### Added

- **Dark Premium Theme**: Complete overhaul of the app UI to a Dark/Orange aesthetic.
- **Home Screen**:
  - Digital Membership Card with dynamic Barcode (Code128).
  - Promotional Banner ("Power Pump").
  - Grid Menu (Workout, Diet, Shop, Blog).
  - Recent Activity section.
- **Profile Screen**:
  - New Header with Avatar and User Tier.
  - Stats Dashboard (Workouts, Calories, Time).
  - Settings Menu.
- **Barcode Support**: Added `react-native-barcode-svg` for dynamic barcode generation.

### Changed

- **Colors**: configuration in `tailwind.config.js` and `Colors.ts` updated to `#121212` (Background), `#1E1E1E` (Surface), `#FFA500` (Primary).
- **Navigation**: Bottom Tab Bar styling updated to match dark theme (Dark Surface, No Border, Orange Active).
- **Auth Screens**: SignIn and SignUp screens updated to Dark Mode.
- **Components**: `MembershipCard`, `ClassCard`, `Button`, `InputField`, `GoogleSignInButton` refactored for Dark Mode.

## [v0.3.0] - 2025-12-15

### Added

- **Classes Feature**:
  - `classes` table in Supabase.
  - `bookings` table in Supabase.
  - Class Booking UI (`classes.tsx`, `ClassCard.tsx`).
  - Booking logic (Membership check + Duplicate check).

## [v0.2.0] - 2025-12-15

### Added

- **Membership Feature**:
  - `membership_plans` table in Supabase.
  - `user_memberships` table in Supabase.
  - Membership Purchase UI (`membership.tsx`, `MembershipCard.tsx`).
