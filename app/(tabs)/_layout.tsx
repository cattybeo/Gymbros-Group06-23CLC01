import Colors from "@/constants/Colors";
import FontAwesome from "@expo/vector-icons/FontAwesome";
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
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.text_secondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 5,
          height: 60 + insets.bottom,
        },
        headerShown: false, // Hide default header (each screen uses custom header)
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
  );
}
