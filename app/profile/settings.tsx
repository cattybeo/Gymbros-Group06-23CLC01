import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useThemeContext } from "@/lib/theme";

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colorScheme, userPreference, setColorScheme } = useThemeContext();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const ThemeOption = ({
    label,
    value,
    icon,
  }: {
    label: string;
    value: "light" | "dark" | "system";
    icon: any;
  }) => (
    <TouchableOpacity
      onPress={() => setColorScheme(value)}
      className={`flex-row items-center justify-between p-4 ${
        value !== "dark" ? "border-b border-border" : ""
      }`}
    >
      <View className="flex-row items-center">
        <View className="w-8 items-center mr-3">
          <Ionicons
            name={icon}
            size={20}
            color={colorScheme === "dark" ? "white" : "black"}
          />
        </View>
        <Text className="text-text font-medium text-lg">{label}</Text>
      </View>
      {userPreference === value && (
        <Ionicons name="checkmark-circle" size={24} color={Colors.light.tint} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface mr-4"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colorScheme === "dark" ? "white" : "black"}
            />
          </TouchableOpacity>
          <Text className="text-text text-xl font-bold flex-1">
            {t("profile.settings")}
          </Text>
        </View>

        <View className="p-4">
          <Text className="text-text_secondary text-sm font-bold uppercase mb-4 mt-2">
            {t("settings.language_label")}
          </Text>

          <View className="bg-surface rounded-2xl overflow-hidden border border-border">
            {/* Vietnamese */}
            <TouchableOpacity
              onPress={() => changeLanguage("vi")}
              className="flex-row items-center justify-between p-4 border-b border-border"
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">🇻🇳</Text>
                <Text className="text-text font-medium text-lg">
                  {t("settings.languages.vi")}
                </Text>
              </View>
              {i18n.language === "vi" && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={Colors.light.tint}
                />
              )}
            </TouchableOpacity>

            {/* English */}
            <TouchableOpacity
              onPress={() => changeLanguage("en")}
              className="flex-row items-center justify-between p-4"
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">🇬🇧</Text>
                <Text className="text-text font-medium text-lg">
                  {t("settings.languages.en")}
                </Text>
              </View>
              {i18n.language === "en" && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={Colors.light.tint}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Theme Settings */}
          <Text className="text-text_secondary text-sm font-bold uppercase mb-4 mt-8">
            {t("settings.theme.title")}
          </Text>

          <View className="bg-surface rounded-2xl overflow-hidden border border-border">
            {/* System */}
            <ThemeOption
              label={t("settings.theme.system")}
              value="system"
              icon="phone-portrait-outline"
            />

            {/* Light */}
            <ThemeOption
              label={t("settings.theme.light")}
              value="light"
              icon="sunny-outline"
            />

            {/* Dark */}
            <ThemeOption
              label={t("settings.theme.dark")}
              value="dark"
              icon="moon-outline"
            />
          </View>

          <Text className="text-muted_foreground text-xs mt-4 text-center">
            {t("profile.version")} 1.2.0 (Diamond)
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
