# AGENTs.md - AI Coding Principles & Mobile Workflow (2026 Edition)

## Continuity Ledger (compaction-safe)

Maintain a single Continuity Ledger for this workspace in `CONTINUITY.md`. The ledger is the canonical session briefing designed to survive context compaction; do not rely on earlier chat text unless it's reflected in the ledger.

### How it works

- At the start of every assistant turn: read `CONTINUITY.md`, update it to reflect the latest goal/constraints/decisions/state, then proceed with the work.
- Update `CONTINUITY.md` again whenever any of these change: goal, constraints/assumptions, key decisions, progress state (Done/Now/Next), or important tool outcomes.
- Keep it short and stable: facts only, no transcripts. Prefer bullets. Mark uncertainty as `UNCONFIRMED` (never guess).
- If you notice missing recall or a compaction/summary event: refresh/rebuild the ledger from visible context, mark gaps `UNCONFIRMED`, ask up to 1-3 targeted questions, then continue.

### `functions.update_plan` vs the Ledger

- `functions.update_plan` is for short-term execution scaffolding while you work (a small 3-7 step plan with pending/in_progress/completed).
- `CONTINUITY.md` is for long-running continuity across compaction (the "what/why/current state"), not a step-by-step task list.
- Keep them consistent: when the plan or state changes, update the ledger at the intent/progress level (not every micro-step).

### In replies

- Begin with a brief "Ledger Snapshot" (Goal + Now/Next + Open Questions). Print the full ledger only when it materially changes or when the user asks.

### `CONTINUITY.md` format (keep headings)

- Goal (incl. success criteria):
- Constraints/Assumptions:
- Key decisions:
- State:
  - Done:
  - Now:
  - Next:
- Open questions (UNCONFIRMED if needed):
- Working set (files/IDs/commands):

## 1. Project Snapshot (Auto-Detected)

_Derived from `package.json` at commit `2026-01-07`_:

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

- **Rule**: NEVER store sensitive keys (Service Account, Private Keys, `GEMINI_API_KEY`) in `EXPO_PUBLIC_*`.
- **Reason**: These variables are embedded into the client bundle and are readable by users.
- **Action**: Use Supabase Edge Functions for sensitive operations. Use `npx supabase secrets set` for server-side keys.

### 3.2. Dependency Management

- **Rule**: Use `npx expo install library-name` instead of `yarn add`.
- **Reason**: Ensures version compatibility with the current Expo SDK.
- **Health Check**: Run `npx expo-doctor` periodically to detect version mismatches.

### 3.3. Release Strategy (OTA)

- **Concept**: Mobile apps cannot just "re-deploy" like web.
- **EAS Update**: Changes to JS/TS/Assets can be pushed via OTA.
- **Native Changes**: Changes to native config (`app.json`, `podfile`) require a **New Binary Build**.

## 4. AI & LLM Architecture (2025-2026 Standards)

### 4.1. The Unified SDK Rule

- **Rule**: Use `@google/genai` as the unified standard library.
- **Legacy Alert**: Do NOT use `@google/generative-ai` or legacy Vertex AI wrappers.
- **Pattern**: Always initialize with `const ai = new GoogleGenAI({ apiKey })`.

### 4.2. Model Selection (Gemini 2.5 & 3)

- **Gemini 2.5 Flash**: Optimized for speed + reasoning. Use for most features (Vibe Analysis, Class Sorting).
- **Gemini 3 Flash (Preview)**: Frontier-class performance. Use for complex agentic tasks or heavy visual/spatial reasoning.
- **Thinking Config**:
  - For Gemini 2.5: Use `thinkingBudget: -1` for dynamic reasoning.
  - For Gemini 3: Prefer `thinkingLevel: "low" | "medium" | "high"` over budget for predictable latency.

### 4.3. Structured Output & Reliability

- **Rule**: Never parse AI responses with regex.
- **Constraint**: Always use `responseMimeType: "application/json"` combined with a native `responseSchema` (generated from Zod).
- **Safety**: Apply `thinkingBudget: 0` only when speed is the absolute priority over accuracy.

### 4.4. Supabase Edge Functions (Deno Runtime)

- **CORS**: Always handle `OPTIONS` preflight and set `Access-Control-Allow-Origin`.
- **Runtime**: Prefer `npm:` specifiers (e.g., `npm:@google/genai`) for library imports in Deno.

## 5. Mobile Performance & UX Rules

### 5.1. Lists & Virtualization

- **Rule**: Use `<FlatList>` or `<FlashList>` for any list > 20 items.
- **Anti-Pattern**: Using `.map()` inside a `<ScrollView>` for dynamic data.
- **Why**: Performance degradation and high memory usage (OOM crashes).

### 5.2. Keyboard Handling

- **Rule**: Always wrap input forms in `<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>`.
- **Validation**: Test input visibility when the keyboard is open.

### 5.3. Accessibility (A11y)

- **Rule**: Interactive elements (`TouchableOpacity`) must have `accessibilityLabel` and `accessibilityRole`.
- **Check**: "Can a user navigate this screen using VoiceOver/TalkBack?"

### 5.4. Push Notifications

- **Constraint**: Real push notifications DO NOT work on Simulators/Emulators.
- **Requirement**: Test push tokens on a physical device.

## 6. Anti-Code-Bloat Workflow

**Step 1: Ingest Context**

- Read `artifacts/llm-context-pack.md` to get a 10,000 ft view.

**Step 2: Coding**

- Avoid adding dependencies for trivial logic (e.g., `lodash` overkill).
- Check `components/ui` for existing UI primitives.

**Step 3: Verification**

- Run `yarn analysis:knip` to find dead code.
- Run `yarn analysis:graph` to check for circular deps.

### 7. CI/PR & Commit Workflow (2026 Standardization)

Before submitting any code or making a commit, follow this **Recursive Integrity Process**:

**Step 1: Check-and-Adjust (Self-Reflection)**

- [ ] Run `yarn lint:unused` and `yarn tsc`.
- [ ] Verify UI against mobile reality (Padding, Accessibility, Keyboard).
- [ ] **Reflection**: "Did I just add a new library for one function?" -> Inline it instead.
- [ ] **Reflection**: "Does this AI feature have a fallback?" -> Ensure UI doesn't crash if AI fails.

**Step 2: Semantic Versioning (SemVer)**

- Update `version` in `package.json`:
  - `PATCH`: Bug fixes, small UI tweaks.
  - `MINOR`: New features (e.g., AI Caching).
  - `MAJOR`: Breaking changes.
- Sync the version string in `app/profile/settings.tsx` footer.

**Step 3: Documentation Sync**

- Update `CHANGELOG.md` with:
  - `Added`: New features.
  - `Changed`: Functional or UI refinements.
  - `Security`: Fixes to keys or Edge Functions.
- Update `docs/` or `artifacts/llm-context-pack.md` if significant architecture changed.

**Step 4: Atomic Commit**

- Use clear, prefix-based messages: `feat:`, `fix:`, `docs:`, `refactor:`, `perf:`.
- Example: `feat: implement persistent AI caching and context stability`.

## 8. 17 Rules of Agentic Coding

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

- [Gemini 2.5 & 3 Release Notes](https://ai.google.dev/gemini-api/docs/changelog) - Dec 2025 Updates.
- [Google Gen AI SDK Migration](https://ai.google.dev/gemini-api/docs/migrate) - Path to unified v1 2025 standard.
- [Thinking Configuration Guide](https://ai.google.dev/gemini-api/docs/thinking) - Setting budget and level.
- [Expo Versions](https://docs.expo.dev/versions/latest/) - Validated SDK 54 mapping.
- [Expo Doctor](https://docs.expo.dev/develop/tools/) - Project health checks.
- [FlatList Optimization](https://reactnative.dev/docs/optimizing-flatlist-configuration) - React Native Docs.
- [Environment Variables](https://docs.expo.dev/guides/environment-variables/) - Security best practices.
- [Knip](https://knip.dev) & [Dep-Cruiser](https://github.com/sverweij/dependency-cruiser) - Static Analysis.
