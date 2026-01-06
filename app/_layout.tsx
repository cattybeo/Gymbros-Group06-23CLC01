import Colors from "@/constants/Colors";
import { AuthProvider, useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import "../global.css";

import { configureGoogleSignIn } from "@/lib/GoogleAuth";
import "@/lib/i18n";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as TaskManager from "expo-task-manager";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";

// Register the task (even if empty) to prevent warnings
TaskManager.defineTask("StripeKeepJsAwakeTask", async () => {
  // This task is required by Stripe SDK to keep the app awake during payment
  // No persistent background logic needed here, just the registration.
});

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Cấu hình Google Sign-In khi app khởi động
  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { colorScheme } = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Logic Auth
  const { session, isLoading } = useAuthContext();
  const segments = useSegments(); // Lấy thông tin về đường dẫn hiện tại
  const router = useRouter();

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Navigation Guard / Onboarding Check
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return; // Chờ load xong trạng thái Auth

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    const checkOnboarding = async () => {
      try {
        console.log("Checking onboarding status...");
        if (session) {
          // Kiểm tra xem user đã có chỉ số cơ thể chưa
          const { data, error } = await supabase
            .from("body_indices")
            .select("id")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (error) {
            console.error("Error fetching body indices:", error);
          }

          const hasBodyIndices = !!data;
          console.log("Has Body Indices:", hasBodyIndices);

          if (!hasBodyIndices && !inOnboardingGroup) {
            console.log("Redirecting to Welcome");
            router.replace("/(onboarding)/welcome");
          } else if (hasBodyIndices && (inAuthGroup || inOnboardingGroup)) {
            console.log("Redirecting to Tabs");
            router.replace("/(tabs)");
          }
        } else if (!session && !inAuthGroup) {
          console.log("Redirecting to Sign In");
          router.replace("/(auth)/sign-in");
        }
      } catch (e) {
        console.error("Onboarding check error:", e);
      } finally {
        setIsChecking(false);
        // Force hide splash screen in case validation takes too long
        SplashScreen.hideAsync();
      }
    };

    checkOnboarding();
  }, [session, isLoading]);

  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  // Nếu chưa load font, đang check auth, hoặc đang check DB -> Hiện thị Splash Screen
  if (!loaded || isLoading || isChecking) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
    </ThemeProvider>
  );
}
