import Colors from "@/constants/Colors";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY as string}
    >
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          tabBarInactiveTintColor: "#6B7280", // Gray-500
          tabBarStyle: {
            backgroundColor: "#1E1E1E", // Surface color (Dark Grey)
            borderTopColor: "#1E1E1E",
            paddingBottom: insets.bottom + 5,
            height: 60 + insets.bottom, // Expand height to cover nav bar
          },
          headerShown: false, // Ẩn Header mặc định để dùng Header riêng của từng trang
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("navigation.home"),
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t("navigation.profile"),
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
        <Tabs.Screen
          name="membership"
          options={{
            title: t("navigation.membership"),
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="credit-card" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="classes"
          options={{
            title: t("navigation.classes"),
            tabBarIcon: ({ color }) => (
              <TabBarIcon name="calendar" color={color} />
            ),
          }}
        />
      </Tabs>
    </StripeProvider>
  );
}
