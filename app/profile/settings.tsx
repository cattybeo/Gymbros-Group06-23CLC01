import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-800">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-800 mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold flex-1">
            {t("profile.settings")}
          </Text>
        </View>

        <View className="p-4">
          <Text className="text-gray-400 text-sm font-bold uppercase mb-4 mt-2">
            {t("settings.language") || "Language"}
          </Text>

          <View className="bg-surface rounded-2xl overflow-hidden border border-gray-800">
            {/* Vietnamese */}
            <TouchableOpacity
              onPress={() => changeLanguage("vi")}
              className="flex-row items-center justify-between p-4 border-b border-gray-800"
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">🇻🇳</Text>
                <Text className="text-white font-medium text-lg">
                  Tiếng Việt
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
                <Text className="text-white font-medium text-lg">English</Text>
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

          <Text className="text-gray-500 text-xs mt-4 text-center">
            Version 0.7.3 (Beta)
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
