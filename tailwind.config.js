/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // REQUIRED: This enables manual toggling (e.g., via settings) to override system preference
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        /* ----- Background Layers ----- */
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        overlay: "rgb(var(--color-overlay) / <alpha-value>)",

        /* ----- Text Colors ----- */
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        "foreground-secondary":
          "rgb(var(--color-foreground-secondary) / <alpha-value>)",
        "foreground-muted":
          "rgb(var(--color-foreground-muted) / <alpha-value>)",

        /* ----- Brand Colors (Premium Orange Palette) ----- */
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-light": "rgb(var(--color-primary-light) / <alpha-value>)",
        "primary-dark": "rgb(var(--color-primary-dark) / <alpha-value>)",
        "on-primary": "rgb(var(--color-on-primary) / <alpha-value>)",

        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-light": "rgb(var(--color-accent-light) / <alpha-value>)",
        "on-accent": "rgb(var(--color-on-accent) / <alpha-value>)",

        /* ----- UI Elements ----- */
        border: "rgb(var(--color-border) / <alpha-value>)",
        input: "rgb(var(--color-input) / <alpha-value>)",
        "input-background":
          "rgb(var(--color-input-background) / <alpha-value>)",
        ring: "rgb(var(--color-ring) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        "on-secondary": "rgb(var(--color-on-secondary) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        "on-muted": "rgb(var(--color-on-muted) / <alpha-value>)",

        /* ----- Status Colors ----- */
        success: "rgb(var(--color-success) / <alpha-value>)",
        "success-background":
          "rgb(var(--color-success-background) / <alpha-value>)",
        "on-success": "rgb(var(--color-on-success) / <alpha-value>)",

        warning: "rgb(var(--color-warning) / <alpha-value>)",
        "warning-background":
          "rgb(var(--color-warning-background) / <alpha-value>)",
        "on-warning": "rgb(var(--color-on-warning) / <alpha-value>)",

        error: "rgb(var(--color-error) / <alpha-value>)",
        "error-background":
          "rgb(var(--color-error-background) / <alpha-value>)",
        "on-error": "rgb(var(--color-on-error) / <alpha-value>)",

        info: "rgb(var(--color-info) / <alpha-value>)",
        "info-background": "rgb(var(--color-info-background) / <alpha-value>)",
        "on-info": "rgb(var(--color-on-info) / <alpha-value>)",

        /* ----- Interactive States ----- */
        "hover-overlay": "rgb(var(--color-hover-overlay) / <alpha-value>)",
        "pressed-overlay": "rgb(var(--color-pressed-overlay) / <alpha-value>)",
        "focus-ring": "rgb(var(--color-focus-ring) / <alpha-value>)",

        /* ----- Legacy Mappings (Backward Compatibility) ----- */
        "card-foreground":
          "rgb(var(--color-popover-foreground) / <alpha-value>)",
        popover: "rgb(var(--color-popover) / <alpha-value>)",
        "popover-foreground":
          "rgb(var(--color-popover-foreground) / <alpha-value>)",
        "primary-foreground":
          "rgb(var(--color-primary-foreground) / <alpha-value>)",
        "secondary-foreground":
          "rgb(var(--color-secondary-foreground) / <alpha-value>)",
        "muted-foreground":
          "rgb(var(--color-muted-foreground) / <alpha-value>)",
        "accent-foreground":
          "rgb(var(--color-accent-foreground) / <alpha-value>)",
        destructive: "rgb(var(--color-destructive) / <alpha-value>)",
        "destructive-foreground":
          "rgb(var(--color-destructive-foreground) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        "text-tertiary": "rgb(var(--color-text-tertiary) / <alpha-value>)",
        "surface-highlight":
          "rgb(var(--color-surface-highlight) / <alpha-value>)",
      },
      boxShadow: {
        /* ----- Shadow System (6 Levels) ----- */
        /* NOTE: Custom box-shadow utilities may not work in React Native context. */
        /* For React Native, use inline styles with elevation or platform-specific shadows. */
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        none: "none",
      },
      borderRadius: {
        /* ----- Border Radius Tokens (7 Levels) ----- */
        "token-sm": "var(--radius-sm)",
        "token-md": "var(--radius-md)",
        "token-lg": "var(--radius-lg)",
        "token-xl": "var(--radius-xl)",
        "token-2xl": "var(--radius-2xl)",
        "token-3xl": "var(--radius-3xl)",
        "token-full": "var(--radius-full)",
      },
      spacing: {
        /* ----- Spacing Tokens ----- */
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
        "2xl": "var(--spacing-2xl)",
      },
    },
  },
  plugins: [],
};
