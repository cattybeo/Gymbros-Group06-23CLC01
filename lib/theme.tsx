import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";

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

/**
 * ThemeProvider component that manages theme state and provides context
 * Loads user preference from AsyncStorage on mount, implements priority resolution logic
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [userPreference, setUserPreference] = useState<
    "light" | "dark" | "system"
  >("system");
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme: systemScheme } = useColorScheme();

  // Load preference on mount
  useEffect(() => {
    loadPreference().then((preference) => {
      setUserPreference(preference);
      setIsLoading(false);
    });
  }, []);

  // Resolve actual colorScheme based on priority
  // Priority: Manual override ("light" or "dark") > System theme
  const resolvedColorScheme: "light" | "dark" = useMemo(() => {
    if (userPreference === "light" || userPreference === "dark") {
      return userPreference;
    }
    return systemScheme ?? "light";
  }, [userPreference, systemScheme]);

  // Update theme preference and persist to AsyncStorage
  const setColorScheme = async (scheme: "light" | "dark" | "system") => {
    try {
      await savePreference(scheme);
      setUserPreference(scheme);
    } catch (error) {
      console.error("[Theme] Failed to save preference:", error);
      // Still update local state even if save fails
      setUserPreference(scheme);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        colorScheme: resolvedColorScheme,
        userPreference,
        setColorScheme,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * Throws error if used outside ThemeProvider
 * @returns ThemeContext value
 */
export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return context;
}

// Export types and constants for use in other modules
export type { ThemeContextType };
export { ThemeContext, STORAGE_KEY };
