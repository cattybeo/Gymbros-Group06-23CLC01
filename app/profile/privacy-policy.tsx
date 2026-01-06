import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutAnimation,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(expandedSection === section ? null : section);
  };

  const SECTIONS = [
    {
      id: "introduction",
      icon: "information-circle",
      title: t("privacy.introduction.title"),
      content: t("privacy.introduction.content"),
    },
    {
      id: "data_collection",
      icon: "document-text",
      title: t("privacy.data_collection.title"),
      content: t("privacy.data_collection.content"),
    },
    {
      id: "data_usage",
      icon: "bulb",
      title: t("privacy.data_usage.title"),
      content: t("privacy.data_usage.content"),
    },
    {
      id: "data_sharing",
      icon: "share-social",
      title: t("privacy.data_sharing.title"),
      content: t("privacy.data_sharing.content"),
    },
    {
      id: "security",
      icon: "shield-checkmark",
      title: t("privacy.security.title"),
      content: t("privacy.security.content"),
    },
    {
      id: "user_rights",
      icon: "accessibility",
      title: t("privacy.user_rights.title"),
      content: t("privacy.user_rights.content"),
    },
    {
      id: "contact",
      icon: "mail",
      title: t("privacy.contact.title"),
      content: t("privacy.contact.content"),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-border bg-card">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-secondary mr-4"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={
                Colors[useColorScheme() === "dark" ? "dark" : "light"].text
              }
            />
          </TouchableOpacity>
          <Text className="text-foreground text-xl font-bold flex-1">
            {t("profile.privacy_policy")}
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-6"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-muted_foreground text-sm mb-6 italic text-center">
            {t("privacy.last_updated")}: 2026-01-05
          </Text>

          {SECTIONS.map((section) => (
            <View key={section.id} className="mb-4">
              <TouchableOpacity
                onPress={() => toggleSection(section.id)}
                className={`flex-row items-center justify-between p-4 rounded-xl border ${
                  expandedSection === section.id
                    ? "bg-card border-primary ring-1 ring-primary"
                    : "bg-card border-border"
                }`}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                      expandedSection === section.id
                        ? "bg-primary"
                        : "bg-secondary"
                    }`}
                  >
                    <Ionicons
                      name={section.icon as any}
                      size={16}
                      color={
                        expandedSection === section.id
                          ? "#FFF"
                          : Colors[
                              useColorScheme() === "dark" ? "dark" : "light"
                            ].text
                      }
                    />
                  </View>
                  <Text
                    className={`font-bold text-base ${
                      expandedSection === section.id
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {section.title}
                  </Text>
                </View>
                <Ionicons
                  name={
                    expandedSection === section.id
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={20}
                  color={
                    expandedSection === section.id
                      ? Colors[useColorScheme() === "dark" ? "dark" : "light"]
                          .tint
                      : Colors[useColorScheme() === "dark" ? "dark" : "light"]
                          .text_secondary
                  }
                />
              </TouchableOpacity>

              {expandedSection === section.id && (
                <View className="p-4 bg-muted/30 rounded-b-xl border-x border-b border-border mt-[-4px]">
                  <Text className="text-foreground leading-6">
                    {section.content}
                  </Text>
                </View>
              )}
            </View>
          ))}

          <View className="h-10" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
