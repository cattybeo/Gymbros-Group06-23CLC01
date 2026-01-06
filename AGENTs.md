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

## 7. 17 Rules of Agentic Coding

Based on Eric Raymond's Unix Philosophy, these principles guide sustainable software development. Adapted from [The Art of Unix Programming](https://cdn.nakamototinstitute.org/docs/taoup.pdf).

### Core Architecture Rules

1. **Rule of Modularity (Quy tắc Tính mô-đun)**
   - Write simple parts connected by clean interfaces
   - Each component/hook should have a single, clear responsibility
   - Example: `useCustomAlert` is a self-contained alert system; `AuthContext` only handles auth state

2. **Rule of Clarity (Quy tắc Tính rõ ràng)**
   - Clarity is better than cleverness
   - Prefer explicit code over magic; write code that reads like prose
   - Use descriptive variable/function names; avoid abbreviations unless obvious

3. **Rule of Composition (Quy tắc Tính kết hợp)**
   - Design programs to connect with other programs
   - Build reusable UI primitives in `components/ui/` that compose into screens
   - Supabase RPC functions enable composable data operations

4. **Rule of Separation (Quy tắc Tính tách biệt)**
   - Separate policy from mechanism; separate interface from engine
   - UI components (mechanism) vs. business logic (policy)
   - AuthContext (engine) vs. route guards (interface)
   - Database schema (data) vs. RLS policies (access control)

5. **Rule of Simplicity (Quy tắc Tính đơn giản)**
   - Design for simplicity; add complexity only when proven necessary
   - No Redux/Zustand when Context suffices
   - Prefer native APIs over heavy libraries
   - If you can't explain it simply, you don't understand it well enough

6. **Rule of Parsimony (Quy tắc Tính tiết kiệm)**
   - Write large programs only when it's clear no smaller approach works
   - Start with component state; elevate to Context only when needed
   - Use native navigation before custom solutions

7. **Rule of Transparency (Quy tắc Tính minh bạch)**
   - Design for visibility to make debugging easier
   - Use console.log strategically for navigation guards flow
   - Error boundaries should reveal failure context
   - Prefer explicit error messages over generic ones

8. **Rule of Robustness (Quy tắc Tính mạnh mẽ)**
   - Robustness is the result of transparency and simplicity
   - Complex code breaks in complex ways; simple code breaks simply
   - Test core flows (auth, booking, membership) thoroughly

9. **Rule of Representation (Quy tắc Tính đại diện)**
   - Fold knowledge into data to simplify program logic
   - Image slugs in `constants/Images.ts` instead of scattered require() calls
   - Translation keys in `lib/i18n/locales/` capture UI text logic
   - Database schema captures business relationships

### Interface & Behavior Rules

10. **Rule of Least Surprise (Quy tắc Ít bất ngờ nhất)**
    - In interface design, always do the least surprising thing
    - Button placement should follow platform conventions
    - Navigation should behave predictably (back button, gestures)
    - Follow React Native and Expo idioms

11. **Rule of Silence (Quy tắc Im lặng)**
    - When a program has nothing surprising to say, it should say nothing
    - Don't log every state change; log meaningful events only
    - Silence in success, noise in failure (see Rule of Repair)
    - Avoid toast notifications for expected operations

12. **Rule of Repair (Quy tắc Sửa chữa)**
    - When you must fail, fail noisily and as early as possible
    - Validate user input at source; show errors immediately
    - Use TypeScript to catch errors at compile time
    - Supabase errors should be surfaced to user via `CustomAlert`

### Development Workflow Rules

13. **Rule of Economy (Quy tắc Tiết kiệm)**
    - Programmer time is expensive; conserve it, not machine time
    - Don't premature optimize; `yarn analysis:knip` is fast enough
    - Prefer readable code over micro-optimizations
    - Use libraries instead of reinventing wheels

14. **Rule of Generation (Quy tắc Tự sinh)**
    - Avoid manual code; write programs to write programs when possible
    - Use `scripts/generate-context.js` to generate project documentation
    - Use Knip to find dead code instead of manual review
    - Supabase migrations generate schema; don't hand-edit SQL

15. **Rule of Optimization (Quy tắc Tối ưu hóa)**
    - Prototype before polishing. Get it working before optimizing
    - Make it work, make it right, then make it fast
    - Use `useFocusEffect` for data refresh before implementing complex caching
    - Profile before optimizing (React DevTools)

16. **Rule of Diversity (Quy tắc Đa dạng)**
    - Distrust all claims for "the one true way"
    - Consider multiple approaches; use the right tool for the job
    - Not everything needs to be a hook; not everything needs to be a component
    - Balance best practices with pragmatism

17. **Rule of Extensibility (Quy tắc Khả năng mở rộng)**
    - Design for the future; it will be here sooner than you think
    - Add i18n keys even if currently single-language
    - Design components for multiple variants (variants, sizes, states)
    - Write database migrations that are reversible

## Sources & Citations

- [Expo Versions](https://docs.expo.dev/versions/latest/) - Validated SDK 54 mapping.
- [Expo Doctor](https://docs.expo.dev/develop/tools/) - Project health checks.
- [FlatList Optimization](https://reactnative.dev/docs/optimizing-flatlist-configuration) - React Native Docs.
- [Environment Variables](https://docs.expo.dev/guides/environment-variables/) - Security best practices.
- [Knip](https://knip.dev) & [Dep-Cruiser](https://github.com/sverweij/dependency-cruiser) - Static Analysis.
