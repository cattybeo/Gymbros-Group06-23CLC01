# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gymbros is a React Native/Expo fitness gym management app with class booking, membership plans, and user profile tracking. Built with Expo SDK 54, TypeScript, NativeWind (Tailwind), and Supabase backend.

## Development Commands

```bash
# Start development server
yarn start

# Platform-specific builds
yarn android    # Run on Android
yarn ios        # Run on iOS
yarn web        # Run on web

# Code quality analysis
yarn analysis:knip       # Detect unused code/deps (outputs to artifacts/knip-report.json)
yarn analysis:graph      # Dependency graph (outputs to artifacts/depgraph.json)
yarn analysis:context    # Generate LLM context pack (outputs to artifacts/llm-context-pack.md)
yarn lint:unused         # Fix unused imports with eslint
```

## Architecture Overview

### File-Based Routing (Expo Router)

The app uses Expo Router's file-based routing with route groups:

- `(auth)/` - Authentication screens (sign-in, sign-up)
- `(onboarding)/` - First-time user flow (welcome, personal-specs)
- `(tabs)/` - Main tab navigation (home, profile, membership, classes)
- `profile/` - Nested profile routes (edit, change-password, body-index, etc.)

### Navigation Guards

Root layout ([`app/_layout.tsx`](app/_layout.tsx)) implements automatic redirects:
- No session → `(auth)/sign-in`
- Has session, no body_indices → `(onboarding)/welcome`
- Has session + body_indices → `(tabs)`

### State Management

- **AuthContext** ([`lib/AuthContext.tsx`](lib/AuthContext.tsx)) - Global auth state using React Context
- Component-level `useState` + `useEffect` for UI state
- Supabase real-time subscriptions available
- No Redux/Zustand - keep it simple with Context + component state

### Supabase Integration

Client configured in [`lib/supabase.ts`](lib/supabase.ts) with AsyncStorage adapter for session persistence.

**Database Schema** ([`database/schema.sql`](database/schema.sql)):
- `membership_plans` - Available tiers
- `user_memberships` - User subscriptions
- `classes` - Gym class schedule
- `bookings` - Class reservations
- `body_indices` - User fitness metrics (onboarding)

**RLS Policies**: All user-specific tables enforce `auth.uid() = user_id` for reads/writes.

**RPC Functions**: Use `get_weekly_traffic` and `get_class_counts` for aggregated data.

### Design System

Gymbros uses a comprehensive **Semantic Token System** for consistent, maintainable styling. All colors, shadows, and spacing are defined as design tokens in [`global.css`](global.css) and mapped to Tailwind utilities in [`tailwind.config.js`](tailwind.config.js).

**Core Philosophy**: Never use hardcoded values. Always use semantic tokens for automatic dark mode support and design consistency.

#### Color Tokens

All colors use semantic tokens defined in `global.css`. Tokens automatically adapt to light/dark mode.

**Primary Brand Colors (Premium Orange Palette)**
- `bg-primary` / `text-primary` - Brand orange (#FF6B35 light, #FF7F50 dark)
- `bg-primary-light` / `text-primary-light` - Hover states
- `bg-primary-dark` / `text-primary-dark` - Active/pressed states
- `bg-on-primary` / `text-on-primary` - Text on primary backgrounds (white)
- `bg-accent` / `text-accent` - Secondary accent (#FFB347 soft orange)
- `bg-accent-light` / `text-accent-light` - Accent hover states
- `bg-on-accent` / `text-on-accent` - Text on accent backgrounds

**Background Layers**
- `bg-background` - App base background (#FAFAFA light, #121212 dark)
- `bg-surface` - Elevated surfaces (#FFFFFF light, #1E1E1E dark)
- `bg-card` - Cards and modals (same as surface)
- `bg-overlay` - Modal backdrops (black with opacity)
- `bg-secondary` - Secondary areas within cards (#F3F4F6 light, #1E1E1E dark)
- `bg-muted` - Disabled/subtle states

**Text Colors**
- `text-foreground` - Primary text (#111827 light, #F8FAFC dark)
- `text-foreground-secondary` - Secondary text, descriptions (#4B5563 light, #CBD5E1 dark)
- `text-foreground-muted` - Tertiary text, captions, disabled (#9CA3AF light, #94A3B8 dark)
- `text-on-secondary` - Text on secondary backgrounds
- `text-on-muted` - Text on muted backgrounds

**Status Colors**
- `bg-success` / `text-success` - Success states (#22C55E light, #4ADE80 dark)
- `bg-success-background` - Success backgrounds
- `bg-warning` / `text-warning` - Warning states (#F59E0B light, #FBBF24 dark)
- `bg-warning-background` - Warning backgrounds
- `bg-error` / `text-error` - Error states (#EF4444 light, #F87171 dark)
- `bg-error-background` - Error backgrounds
- `bg-info` / `text-info` - Info states (#3B82F6 light, #60A5FA dark)
- `bg-info-background` - Info backgrounds

**UI Elements**
- `border-border` - Card borders, dividers (#E5E7EB light, #333333 dark)
- `border-input` - Input field borders
- `bg-input-background` - Input field backgrounds
- `ring` / `focus-ring` - Focus rings, keyboard navigation (#FF6B35)

#### Shadow System (6 Elevation Levels)

Use elevation tokens for depth. In dark mode, shadows are less visible; rely on borders for elevation.

- `shadow-xs` - Subtle elevation (inline elements, badges)
- `shadow-sm` - Small elevation (default for buttons, cards)
- `shadow-md` - Medium elevation (dropdowns, panels)
- `shadow-lg` - Large elevation (modals, popovers)
- `shadow-xl` - Extra large elevation (tooltips, heavy elevation)
- `shadow-2xl` - Maximum elevation (dialogs)

#### Border Radius Tokens (7 Levels)

Use token values for consistency across components.

- `rounded-token-sm` - 8px (small elements, badges, tags)
- `rounded-token-md` - 12px (buttons, inputs, form controls)
- `rounded-token-lg` - 16px (large cards, panels)
- `rounded-token-xl` - 20px (extra large cards, modals)
- `rounded-token-2xl` - 24px (hero sections, large containers)
- `rounded-token-3xl` - 28px (special containers, featured elements)
- `rounded-token-full` - 9999px (circular elements, avatars, pills)

#### Spacing Tokens

Semantic spacing tokens for consistent layouts.

- `spacing-xs` - 4px (micro spacing, tight layouts)
- `spacing-sm` - 8px (small spacing, compact layouts)
- `spacing-md` - 16px (default spacing, regular layouts)
- `spacing-lg` - 24px (large spacing, comfortable layouts)
- `spacing-xl` - 32px (extra large spacing, section separation)
- `spacing-2xl` - 48px (massive spacing, hero sections)

#### Usage Examples

**❌ Don't: Hardcoded colors**
```tsx
<View className="bg-white rounded-xl shadow-sm">
  <Text className="text-black">Hello</Text>
</View>
```

**✅ Do: Semantic tokens**
```tsx
<View className="bg-card rounded-token-xl shadow-md border border-border">
  <Text className="text-foreground">Hello</Text>
</View>
```

**❌ Don't: Hardcoded values**
```tsx
<View style={{ backgroundColor: "#FF6B35", borderRadius: 12 }}>
  <Text style={{ color: "#FFFFFF" }}>Button</Text>
</View>
```

**✅ Do: Semantic tokens**
```tsx
<View className="bg-primary rounded-token-md">
  <Text className="text-on-primary">Button</Text>
</View>
```

**❌ Don't: Arbitrary shadows**
```tsx
<View style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 } }}>
  Content
</View>
```

**✅ Do: Semantic shadow tokens**
```tsx
<View className="shadow-lg">
  Content
</View>
```

#### When to Use Each Token

**Background Hierarchy** (bottom to top):
1. `bg-background` - Base app background
2. `bg-surface` / `bg-card` - Elevated cards, panels
3. `bg-overlay` - Modal backdrops

**Text Hierarchy** (most to least important):
1. `text-foreground` - Headings, primary content
2. `text-foreground-secondary` - Body text, descriptions
3. `text-foreground-muted` - Captions, placeholders, disabled

**Elevation Hierarchy** (lowest to highest):
1. `shadow-xs` - Inline elements
2. `shadow-sm` - Default cards, buttons
3. `shadow-md` - Dropdowns, panels
4. `shadow-lg` - Modals, popovers
5. `shadow-xl` / `shadow-2xl` - Heavy elevation

#### Adding New Tokens

**Procedure:**
1. Define CSS variable in `global.css` (both `:root` and `.dark`)
2. Add Tailwind mapping in `tailwind.config.js`
3. Update `constants/Colors.ts` for React Native usage
4. Document usage guidelines in this section

**Example: Adding a new "info-primary" token**
```css
/* global.css - :root and .dark */
--color-info-primary: 59 130 246;
```

```javascript
// tailwind.config.js
colors: {
  "info-primary": "rgb(var(--color-info-primary) / <alpha-value>)",
}
```

#### Dark Mode Considerations

- All tokens automatically adapt to dark mode
- Test UI in both light and dark modes
- Dark mode uses true black (#121212) for OLED efficiency
- Desaturated colors in dark mode for better readability
- Use borders (`border-border`) for elevation in dark mode when shadows are less visible

#### Accessibility Requirements

- Ensure minimum 4.5:1 contrast ratio for normal text
- Ensure minimum 3:1 contrast ratio for large text (18px+)
- Use `text-foreground` on `bg-background` (high contrast)
- Use `text-on-primary` on `bg-primary` (white on orange)
- Test with accessibility tools (WCAG guidelines)

#### TypeScript Usage

For TypeScript components, import color constants from [`constants/Colors.ts`](constants/Colors.ts):

```typescript
import Colors from "@/constants/Colors";

const colorScheme = useColorScheme();
const backgroundColor = Colors[colorScheme].background;
```

#### Related Documentation

See [DESIGN_SYSTEM.md](C:/Users/ADMIN/.gemini/antigravity/brain/c3c84b73-011f-433d-bc08-df352e43197b/DESIGN_SYSTEM.md) for detailed design philosophy and visual identity guidelines.

### Styling System

NativeWind 4.x with Tailwind CSS. Design tokens defined in [`global.css`](global.css) as CSS variables.

Use semantic color tokens (see Design System section above):
- Backgrounds: `bg-background`, `bg-surface`, `bg-card`, `bg-overlay`
- Text: `text-foreground`, `text-foreground-secondary`, `text-foreground-muted`
- Brand: `bg-primary`, `bg-accent`, `bg-primary-light`
- Status: `text-error`, `text-success`, `text-warning`, `text-info`
- Borders: `border-border`, `border-input`

Path alias: `@/*` maps to project root (configured in [`tsconfig.json`](tsconfig.json)).

### Internationalization

i18next configured in [`lib/i18n/index.ts`](lib/i18n/index.ts). Auto-detects device language, defaults to Vietnamese (`vi`).

Usage:
```typescript
const { t } = useTranslation();
t("common.save")
```

Locales in [`lib/i18n/locales/`](lib/i18n/locales/).

### Custom Hooks

- `useCustomAlert` ([`hooks/useCustomAlert.tsx`](hooks/useCustomAlert.tsx)) - Unified alert/modal system with `CustomAlertComponent`

## Component Patterns

1. **Functional components with hooks only** - No class components
2. **Parallel data fetching** - Use `Promise.all()` for multiple independent queries
3. **useFocusEffect** - Refresh data when screen comes into focus
4. **TypeScript interfaces** - Export shared types from [`lib/types.ts`](lib/types.ts)
5. **UI components** - Reusable primitives in [`components/ui/`](components/ui/)

## Code Quality Tools

- **Knip** ([`knip.json`](knip.json)) - Unused files, exports, dependencies detection
- **dependency-cruiser** ([`.dependency-cruiser.js`](.dependency-cruiser.js)) - Circular dependency detection
- **ESLint** - Unused import auto-fix

Always run `yarn analysis:knip` before committing to catch unused code.

## 17 Rules of Agentic Coding

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

## Important Conventions

- **Image slugs** - Referenced by slug (e.g., `gold_pack`, `morning_yoga`) mapped to assets in [`constants/Images.ts`](constants/Images.ts)
- **Date handling** - Use `dayjs` for date manipulation
- **Edge functions** - Use Supabase Edge Functions for payments, not direct Stripe
- **No secrets in client** - All sensitive operations via Supabase RLS or Edge Functions
- **Barrier pattern** - Navigation guards prevent unauthorized access; don't bypass

## References

- [Eric Raymond's 17 Unix Rules - Programming Philosophy](https://medium.com/programming-philosophy/eric-raymond-s-17-unix-rules-399ac802807)
- [17 Principles of (Unix) Software Design](https://paulvanderlaken.com/2019/09/17/17-principles-of-unix-software-design/)
- [Unix principles guiding agentic AI](https://www.eficode.com/blog/unix-principles-guiding-agentic-ai-eternal-wisdom-for-new-innovations)
