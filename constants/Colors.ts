// Premium orange brand color
const tintColorLight = "#FF6B35";
const tintColorDark = "#FF7F50";

export default {
  light: {
    // ----- Background Layers -----
    // App background, page-level backgrounds
    background: "#FAFAFA",
    // Cards, panels, elevated surfaces
    surface: "#FFFFFF",
    // Nested cards, secondary elevation levels
    card: "#FFFFFF",
    // Modals, overlays, backdrops
    overlay: "#000000",

    // ----- Text Colors -----
    // Primary text, headings, important content
    text: "#111827",
    // Alias for text (maintained for backward compatibility)
    foreground: "#111827",
    // Secondary text, descriptions, body content
    foreground_secondary: "#374151",
    // Tertiary text, captions, disabled states
    foreground_muted: "#4B5563",

    // ----- Brand Colors (Premium Orange Palette) -----
    // Primary buttons, links, key interactive elements
    primary: "#FF6B35",
    // Primary hover states, highlights
    primary_light: "#FF8C42",
    // Primary active/pressed states
    primary_dark: "#E55A2B",
    // Text on primary backgrounds
    on_primary: "#FFFFFF",
    // Secondary accents, highlights, tags
    accent: "#FFB347",
    // Accent hover states
    accent_light: "#FFC377",
    // Text on accent backgrounds
    on_accent: "#111827",

    // ----- UI Elements -----
    // Borders, dividers, outlines
    border: "#E5E7EB",
    // Input fields, form controls
    input: "#E5E7EB",
    // Input backgrounds
    input_background: "#FFFFFF",
    // Focus rings, keyboard navigation indicators
    ring: "#FF6B35",

    // Secondary backgrounds, subtle sections
    secondary: "#F3F4F6",
    // Text on secondary backgrounds
    on_secondary: "#111827",
    // Muted backgrounds, disabled states
    muted: "#F3F4F6",
    // Text on muted backgrounds
    on_muted: "#9CA3AF",

    // ----- Semantic Components (Legacy Compatibility) -----
    card_foreground: "#111827",
    popover: "#FFFFFF",
    popover_foreground: "#111827",
    primary_foreground: "#FFFFFF",
    secondary_foreground: "#111827",
    muted_foreground: "#4B5563",
    accent_foreground: "#111827",
    destructive: "#EF4444",
    destructive_foreground: "#FFFFFF",

    // ----- Legacy Aliases (Backward Compatibility) -----
    surface_highlight: "#F3F4F6",
    text_secondary: "#4B5563",
    text_tertiary: "#9CA3AF",

    // ----- Status Colors -----
    // Success states, confirmations, positive feedback
    success: "#22C55E",
    success_background: "#86EFAC",
    on_success: "#FFFFFF",
    // Warning states, caution messages
    warning: "#F59E0B",
    warning_background: "#FDE68A",
    on_warning: "#111827",
    // Error states, destructive actions
    error: "#EF4444",
    error_background: "#FEB2B2",
    on_error: "#FFFFFF",
    // Info states, informational messages
    info: "#3B82F6",
    info_background: "#93C5FD",
    on_info: "#FFFFFF",

    // ----- Interactive States -----
    hover_overlay: "#000000",
    pressed_overlay: "#000000",
    focus_ring: "#FF6B35",

    // ----- App Specific -----
    tint: tintColorLight,
    tabIconDefault: "#9CA3AF",
    tabIconSelected: tintColorLight,
    silver: "#C0C0C0",
    gold: "#FFD700",
    platinum: "#22d3ee",
  },
  dark: {
    // ----- Background Layers -----
    // App background, page-level backgrounds (OLED optimized)
    background: "#121212",
    // Cards, panels, elevated surfaces
    surface: "#1E1E1E",
    // Nested cards, secondary elevation levels
    card: "#252525",
    // Modals, overlays, backdrops
    overlay: "#000000",

    // ----- Text Colors -----
    // Primary text, headings, important content
    text: "#F8FAFC",
    // Alias for text (maintained for backward compatibility)
    foreground: "#F8FAFC",
    // Secondary text, descriptions, body content
    foreground_secondary: "#CBD5E1",
    // Tertiary text, captions, disabled states
    foreground_muted: "#94A3B8",

    // ----- Brand Colors (Premium Orange Palette - Desaturated) -----
    // Primary buttons, links, key interactive elements
    primary: "#FF7F50",
    // Primary hover states, highlights
    primary_light: "#FF9F70",
    // Primary active/pressed states
    primary_dark: "#E66432",
    // Text on primary backgrounds
    on_primary: "#FFFFFF",
    // Secondary accents, highlights, tags
    accent: "#FFB347",
    // Accent hover states
    accent_light: "#FFC377",
    // Text on accent backgrounds
    on_accent: "#111827",

    // ----- UI Elements -----
    // Borders, dividers, outlines
    border: "#333333",
    // Input fields, form controls
    input: "#333333",
    // Input backgrounds
    input_background: "#1E1E1E",
    // Focus rings, keyboard navigation indicators
    ring: "#FF7F50",

    // Secondary backgrounds, subtle sections
    secondary: "#1E1E1E",
    // Text on secondary backgrounds
    on_secondary: "#F8FAFC",
    // Muted backgrounds, disabled states
    muted: "#1E1E1E",
    // Text on muted backgrounds
    on_muted: "#94A3B8",

    // ----- Semantic Components (Legacy Compatibility) -----
    card_foreground: "#F8FAFC",
    popover: "#1E1E1E",
    popover_foreground: "#F8FAFC",
    primary_foreground: "#FFFFFF",
    secondary_foreground: "#F8FAFC",
    muted_foreground: "#94A3B8",
    accent_foreground: "#F8FAFC",
    destructive: "#F87171",
    destructive_foreground: "#F8FAFC",

    // ----- Legacy Aliases (Backward Compatibility) -----
    surface_highlight: "#1E1E1E",
    text_secondary: "#CBD5E1",
    text_tertiary: "#94A3B8",

    // ----- Status Colors -----
    // Success states, confirmations, positive feedback (brighter for dark mode)
    success: "#4ADE80",
    success_background: "#16A34A",
    on_success: "#FFFFFF",
    // Warning states, caution messages (brighter for dark mode)
    warning: "#FBBF24",
    warning_background: "#B45309",
    on_warning: "#FFFFFF",
    // Error states, destructive actions (brighter for dark mode)
    error: "#F87171",
    error_background: "#B91C1C",
    on_error: "#FFFFFF",
    // Info states, informational messages (brighter for dark mode)
    info: "#60A5FA",
    info_background: "#1D4ED8",
    on_info: "#FFFFFF",

    // ----- Interactive States -----
    hover_overlay: "#FFFFFF",
    pressed_overlay: "#FFFFFF",
    focus_ring: "#FF7F50",

    // ----- App Specific -----
    tint: tintColorDark,
    tabIconDefault: "#64748B",
    tabIconSelected: tintColorDark,
    silver: "#C0C0C0",
    gold: "#FFD700",
    platinum: "#22d3ee",
  },
};
