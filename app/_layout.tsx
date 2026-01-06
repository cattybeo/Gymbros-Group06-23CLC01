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
import { StripeProvider } from "@stripe/stripe-react-native";
import { useFonts } from "expo-font";
import {
  Stack,
  router,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as TaskManager from "expo-task-manager";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  UIManager,
  View,
} from "react-native";
import "react-native-reanimated";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY as string}
    >
      <AuthProvider>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </AuthProvider>
    </StripeProvider>
  );
}

function LoadingScreen({ backgroundColor }: { backgroundColor: string }) {
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
      <ActivityIndicator size="large" color={Colors.light.primary} />
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

  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const showLoading = !loaded || themeLoading;

  return (
    <NavigationThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <View style={{ flex: 1 }} className={colorScheme}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
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
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoading || !rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    const checkOnboarding = async () => {
      try {
        if (session) {
          const { data, error } = await supabase
            .from("body_indices")
            .select("id")
            .eq("user_id", session.user.id)
            .maybeSingle();

          const hasBodyIndices = !!data;

          if (!hasBodyIndices && !inOnboardingGroup) {
            router.replace("/(onboarding)/welcome");
          } else if (hasBodyIndices && (inAuthGroup || inOnboardingGroup)) {
            router.replace("/(tabs)");
          }
        } else if (!session && !inAuthGroup) {
          router.replace("/(auth)/sign-in");
        }
      } catch (e) {
        console.error("Auth guard error:", e);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [session, isLoading, segments, rootNavigationState?.key]);

  return null;
}
