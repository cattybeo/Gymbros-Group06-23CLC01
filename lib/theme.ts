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

/**
 * Loads user's theme preference from AsyncStorage
 * Handles corrupted data, missing keys, and storage errors gracefully
 * @returns User's theme preference ("light" | "dark" | "system"), defaults to "system"
 */
export async function loadPreference(): Promise<"light" | "dark" | "system"> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    if (!value) {
      return "system";
    }

    const parsed = JSON.parse(value) as { theme: string };
    if (!["light", "dark", "system"].includes(parsed.theme)) {
      throw new Error(`Invalid theme value: ${parsed.theme}`);
    }
    return parsed.theme as "light" | "dark" | "system";
  } catch (error) {
    console.warn("[Theme] Failed to load preference, using system:", error);
    return "system";
  }
}

/**
 * Saves user's theme preference to AsyncStorage
 * @param theme - Theme preference to save ("light" | "dark" | "system")
 * @throws Re-throws error for component-level handling
 */
export async function savePreference(
  theme: "light" | "dark" | "system",
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ theme }));
  } catch (error) {
    console.error("[Theme] Failed to save preference:", error);
    throw error; // Re-throw to handle in component
  }
}

// Export types and constants for use in other modules
export type { ThemeContextType };
export { ThemeContext, STORAGE_KEY };
