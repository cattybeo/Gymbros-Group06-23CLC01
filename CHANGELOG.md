# Changelog

## [0.2.2] - 2025-12-16

### Added

- **UI/UX**: Implemented `SafeAreaView` across Welcome, SignIn, and PersonalSpecs screens to support edge-to-edge Android devices and prevent overlap with system bars.
- **Animations**: Added `react-native-reanimated` entry effects (FadeInDown, FadeInUp) to SignIn and Welcome screens for a premium feel.

### Fixed

- **Barcode**: Resolved `NaN` viewBox crash on Android by replacing `maxWidth` with fixed `width` and adding conditional rendering.
- **Navigation**: Fixed route registration for `(onboarding)` group in root layout to resolve runtime warnings.
- **Network**: Resolved Metro connection issues on Android Emulator.
- **Dependencies**: Fixed NDK corruption and AGP version mismatches.
