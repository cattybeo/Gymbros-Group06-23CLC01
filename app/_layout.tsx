import Colors from "@/constants/Colors";
import { AuthProvider, useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { ThemeProvider, useThemeContext } from "@/lib/theme";
import "../global.css";

import { configureGoogleSignIn } from "@/lib/GoogleAuth";
import "@/lib/i18n";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";
import {
  Stack,
  router,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as TaskManager from "expo-task-manager";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Register task required by Stripe SDK (prevents warnings)
TaskManager.defineTask("StripeKeepJsAwakeTask", async () => {
  // NOTE: Stripe SDK requires this task registration to keep app awake during payment
});

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent auto-hide before fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Configure Google Sign-In on app startup
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!stripeKey) {
    console.warn(
      "[Stripe] Warning: EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined in environment variables. Payment will fail."
    );
  }

  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={stripeKey as string} urlScheme="gymbros">
        <AuthProvider>
          <ThemeProvider>
            <RootLayoutNav />
          </ThemeProvider>
        </AuthProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}

function LoadingScreen({ backgroundColor }: { backgroundColor: string }) {
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          alignItems: "center",
          justifyContent: "center",
          backgroundColor,
          zIndex: 50,
        },
      ]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function RootLayoutNav() {
  // Theme state
  const { colorScheme, isLoading: themeLoading } = useThemeContext();
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Forward deep links to Stripe so SDK can complete 3DS / redirect flows
  const { handleURLCallback } = useStripe();
  useEffect(() => {
    const onUrl = async ({ url }: { url: string }) => {
      if (!url) return;
      try {
        await handleURLCallback(url);
      } catch (err) {
        console.warn("[Stripe] handleURLCallback error", err);
      }
    };

    const sub = Linking.addEventListener("url", onUrl);

    (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) await handleURLCallback(initialUrl);
      } catch (err) {
        console.warn("[Stripe] handleURLCallback initial error", err);
      }
    })();

    return () => {
      if (sub && typeof sub.remove === "function") sub.remove();
    };
  }, [handleURLCallback]);

  const colors = Colors[colorScheme];
  const showLoading = !loaded || themeLoading;

  return (
    <NavigationThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      {/* 
        CRITICAL: We apply the theme class to a View that wraps the entire navigation tree.
        This enables CSS variable propagation (dark: variants) throughout the app.
        We use a key to ensure a clean re-render when switching themes to prevent interop loops.
      */}
      <View
        key={colorScheme}
        style={{ flex: 1, backgroundColor: colors.background }}
        className={colorScheme}
      >
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            animation: "fade",
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
          <Stack.Screen
            name="profile/change-password"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="profile/body-index"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="profile/add-body-index"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="profile/privacy-policy"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="profile/settings"
            options={{ headerShown: false }}
          />
        </Stack>
        {rootNavigationState?.key && <AuthGuard />}
        {showLoading && <LoadingScreen backgroundColor={colors.background} />}
      </View>
    </NavigationThemeProvider>
  );
}

function AuthGuard() {
  const { session, isLoading } = useAuthContext();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // Wait for auth to load and root navigation to be ready
    if (isLoading || !rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    const checkOnboarding = async () => {
      try {
        if (!session) {
          // No session -> must go to auth
          if (!inAuthGroup) {
            router.replace("/(auth)/sign-in");
          }
          return;
        }

        // Session exists -> check onboarding status
        const { data, error } = await supabase
          .from("body_indices")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) throw error;
        const hasBodyIndices = !!data;

        if (!hasBodyIndices) {
          // No onboarding -> force welcome
          if (!inOnboardingGroup) {
            router.replace("/(onboarding)/welcome");
          }
        } else {
          // Fully onboarded -> force tabs if trying to go back to auth/onboarding
          if (inAuthGroup || inOnboardingGroup) {
            router.replace("/(tabs)");
          }
        }
      } catch (e) {
        console.error("[AuthGuard] Error:", e);
      }
    };

    checkOnboarding();
  }, [session, isLoading, segments, rootNavigationState?.key]);

  return null;
}
