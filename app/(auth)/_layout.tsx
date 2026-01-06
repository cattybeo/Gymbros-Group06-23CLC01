import Colors from "@/constants/Colors";
import { useThemeContext } from "@/lib/theme";
import { Stack } from "expo-router";

export default function AuthLayout() {
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];
  const backgroundColor = colors.background;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor },
        animationDuration: 250,
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
