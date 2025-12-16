# Troubleshooting Tips

## TS2632: Import declaration can only be used at the top level

### 🔴 Symptom

The build fails with:

> `Error: An import declaration can only be used at the top level of a namespace or module.`

On checking the file, you see an `import` statement inside a function component:

```typescript
export default function MyComponent() {
  import { useRouter } from "expo-router"; // <--- ILLEGAL
  // ...
}
```

### 🔍 Root Cause

This often happens when:

1.  **AI/Auto-Refactoring Error**: An automated tool (or Copilot) inserted code relative to a specific match (e.g., "add this variable") but failed to distinguish between "inside function scope" and "global scope" for imports.
2.  **Copy-Paste Error**: Copying a whole block of code that included imports and pasting it into an existing component.

### ✅ Solution

Move the import statement to the very top of the file, outside of any function or class bodies.

**Before:**

```typescript
export default function Component() {
  import { Foo } from "bar";
  return <View />;
}
```

**After:**

```typescript
import { Foo } from "bar";

export default function Component() {
  return <View />;
}
```

### 🛡️ Prevention Rule

> "When accepting AI code edits that add dependencies, **always verify** that new `import` lines are placed at line 1-10 of the file, never indented inside curly braces `{ }`."
