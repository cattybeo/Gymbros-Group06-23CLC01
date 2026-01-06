# AGENTs.md - AI Coding Principles & Mobile Workflow (2026 Edition)

> **Context Blindness Mitigation**: This document serves as the "Rule of Law" for AI Agents working on this Expo/React Native project. Follow it strictly to avoid code bloat and architectural drift.

## 1. Project Snapshot (Auto-Detected)

_Derived from `package.json` at commit `2026-01-05`_:

- **Framework**: Expo SDK ~54 (React Native 0.81.5)
- **Language**: TypeScript (`.ts`, `.tsx`) in Strict Mode
- **Router**: Expo Router (File-based routing in `app/`)
- **Styling**: NativeWind (Tailwind CSS)
- **State Management**: React Context + Supabase
- **Package Manager**: Yarn

## 2. Coding Principles

### 2.1. Rule: No "Just In Case" Code (YAGNI)

- **Why**: Bloats app size and slows down build times.
- **Enforced by**: `Knip` (Unused code detection).
- **Check**: Before creating a file, search for existing utilities. If you write a helper function, use it immediately or delete it.

### 2.2. Rule: Search First, Create Last

- **Why**: Prevents duplicate components (e.g., re-implementing `Button`).
- **How**: Always run `find src/components` or `grep` before implementing UI. Read `artifacts/llm-context-pack.md`.

### 2.3. Rule: Strict Boundaries & Cycles

- **Why**: Require cycles cause uninitialized values, runtime bugs, and hard-to-debug behavior (and warnings in Metro).
- **Enforced by**: `dependency-cruiser` (CI Gate).
- **Structure**:
  - `app/` imports `components/`, `lib/`, `hooks/`.
  - `components/` imports `lib/`, `hooks/`.
  - `lib/` imports standard libraries (node_modules).
  - **NEVER**: `lib/` imports `components/` (Circular!).

### 2.4. Rule: Expo Router Conventions

- **404 Handling**: Use `app/+not-found.tsx` for unmatched routes.
- **Layouts**: Use `_layout.tsx` for nested navigation and context providers.
- **Root**: `app/index.tsx` is the entry point (or redirect logic).

## 3. Expo/RN Operating Rules (Mobile Reality)

### 3.1. Secrets & Environment Variables

- **Rule**: NEVER store sensitive keys (Service Account, Private Keys) in `EXPO_PUBLIC_*`.
- **Reason**: These variables are embedded into the client bundle and are readable by users.
- **Action**: Use Supabase Edge Functions for sensitive operations.

### 3.2. Dependency Management

- **Rule**: Use `npx expo install library-name` instead of `yarn add`.
- **Reason**: Ensures version compatibility with the current Expo SDK.
- **Health Check**: Run `npx expo-doctor` periodically to detect version mismatches.

### 3.3. Release Strategy (OTA)

- **Concept**: Mobile apps cannot just "re-deploy" like web.
- **EAS Update**: Changes to JS/TS/Assets can be pushed via OTA.
- **Native Changes**: Changes to native config (`app.json`, `podfile`) require a **New Binary Build**.

## 4. Mobile Performance & UX Rules

### 4.1. Lists & Virtualization

- **Rule**: Use `<FlatList>` or `<FlashList>` for any list > 20 items.
- **Anti-Pattern**: Using `.map()` inside a `<ScrollView>` for dynamic data.
- **Why**: Performance degradation and high memory usage (OOM crashes).

### 4.2. Keyboard Handling

- **Rule**: Always wrap input forms in `<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>`.
- **Validation**: Test input visibility when the keyboard is open.

### 4.3. Accessibility (A11y)

- **Rule**: Interactive elements (`TouchableOpacity`) must have `accessibilityLabel` and `accessibilityRole`.
- **Check**: "Can a user navigate this screen using VoiceOver/TalkBack?"

### 4.4. Push Notifications

- **Constraint**: Real push notifications DO NOT work on Simulators/Emulators.
- **Requirement**: Test push tokens on a physical device.

## 5. Anti-Code-Bloat Workflow

**Step 1: Ingest Context**

- Read `artifacts/llm-context-pack.md` to get a 10,000 ft view.

**Step 2: Coding**

- Avoid adding dependencies for trivial logic (e.g., `lodash` overkill).
- Check `components/ui` for existing UI primitives.

**Step 3: Verification**

- Run `yarn analysis:knip` to find dead code.
- Run `yarn analysis:graph` to check for circular deps.

## 6. CI/PR Checklist

1. [ ] **Health Pass**: `npx expo-doctor` returns no issues.
2. [ ] **Lint & Types**: `yarn lint:unused` and `yarn tsc` pass.
3. [ ] **No Circular Deps**: `artifacts/depgraph.json` shows clean graph.
4. [ ] **No Unused Code**: `artifacts/knip-report.json` is clean-ish.
5. [ ] **Performance**: Lists use FlatList; Keyboard handling implemented.
6. [ ] **Secrets Safe**: No private keys in client code.

## Sources & Citations

- [Expo Versions](https://docs.expo.dev/versions/latest/) - Validated SDK 54 mapping.
- [Expo Doctor](https://docs.expo.dev/develop/tools/) - Project health checks.
- [FlatList Optimization](https://reactnative.dev/docs/optimizing-flatlist-configuration) - React Native Docs.
- [Environment Variables](https://docs.expo.dev/guides/environment-variables/) - Security best practices.
- [Knip](https://knip.dev) & [Dep-Cruiser](https://github.com/sverweij/dependency-cruiser) - Static Analysis.
