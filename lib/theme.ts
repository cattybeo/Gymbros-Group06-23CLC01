import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme as NativeWindColorScheme } from "nativewind";

/**
 * Theme context interface for managing theme state
 * Provides both resolved colorScheme and user preference
 */
interface ThemeContextType {
  /** Resolved theme (light or dark), considering user preference and system setting */
  colorScheme: "light" | "dark";
  /** User's selected preference (light, dark, or system default) */
  userPreference: "light" | "dark" | "system";
  /** Function to update theme preference */
  setColorScheme: (scheme: "light" | "dark" | "system") => void;
  /** Indicates if theme preference is being loaded from storage */
  isLoading: boolean;
}

/**
 * Theme context for managing application theme state
 * Undefined default value ensures context is used within ThemeProvider
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * AsyncStorage key for persisting user's theme preference
 */
const STORAGE_KEY = "@gymbros_theme_preference";

// Export types and constants for use in other modules
export type { ThemeContextType };
export { ThemeContext, STORAGE_KEY };
