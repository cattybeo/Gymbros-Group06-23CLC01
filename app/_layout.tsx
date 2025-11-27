import { AuthProvider, useAuthContext } from "@/lib/AuthContext";
import "../global.css";

import { configureGoogleSignIn } from "@/lib/GoogleAuth";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, useColorScheme, View } from "react-native";
import "react-native-reanimated";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
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
  const colorScheme = useColorScheme();
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

  // Navigation Guard
  useEffect(() => {
    if (isLoading) return; // Chờ load xong trạng thái Auth

    const inAuthGroup = segments[0] === "(auth)"; // Kiểm tra xem có trong nhóm auth không

    if (session && inAuthGroup) {
      // Case 1: Đã đăng nhập nhưng lại đang đứng ở trang Login/Register
      router.replace("/(tabs)"); // Chuyển vào trong App chính
    } else if (!session && !inAuthGroup) {
      // Case 2: Chưa đăng nhập nhưng đang đứng ngoài trang Login/Register
      router.replace("/(auth)/sign-in"); // Chuyển về trang Login
    }
  }, [session, segments, isLoading, loaded]);

  // Nếu chưa load font hoặc đang check session -> Hiện thị Splash Screen
  if (!loaded || isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
