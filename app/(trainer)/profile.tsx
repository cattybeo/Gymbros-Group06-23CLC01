import Button from "@/components/ui/Button";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrainerProfile() {
  const { profile } = useAuthContext();
  const { colorScheme, userPreference, setColorScheme } = useThemeContext();
  const { t, i18n } = useTranslation();
  const colors = Colors[colorScheme];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/sign-in");
  };

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
        <Text className="text-foreground font-medium text-lg">{label}</Text>
      </View>
      {userPreference === value && (
        <Ionicons name="checkmark-circle" size={24} color={Colors.light.tint} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <Text className="text-3xl font-bold text-foreground mb-6">
          {t("trainer.profile.title")}
        </Text>

        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-full bg-card items-center justify-center border-4 border-background overflow-hidden relative shadow-md mb-4">
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <FontAwesome
                name="user-circle"
                size={80}
                color={colors.primary}
              />
            )}
          </View>
          <Text className="text-2xl font-bold text-foreground">
            {profile?.full_name}
          </Text>
          <Text className="text-muted_foreground mb-2">{profile?.email}</Text>

          {/* Experience Badge */}
          {profile?.experience_years && (
            <View className="bg-primary/20 px-4 py-1.5 rounded-full border border-primary/30">
              <Text className="text-primary font-bold text-xs uppercase">
                {profile.experience_years} {t("classes.years_exp")}
              </Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View className="bg-card p-5 rounded-2xl border border-border mb-6 shadow-sm">
          <View className="mb-4">
            <Text className="text-muted_foreground text-xs font-bold uppercase mb-2">
              {t("trainer.profile.specialty")}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profile?.specialties && profile.specialties.length > 0 ? (
                profile.specialties.map((skill: string, index: number) => (
                  <View
                    key={`skill-${index}`}
                    className="bg-accent/10 px-3 py-1 rounded-full border border-accent/20"
                  >
                    <Text className="text-accent text-xs font-medium">
                      #{skill}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-foreground-secondary italic text-sm">
                  {t("trainer.profile.no_specialties")}
                </Text>
              )}
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-muted_foreground text-xs font-bold uppercase mb-1">
              {t("trainer.profile.bio")}
            </Text>
            <Text className="text-foreground text-sm leading-5">
              {profile?.bio || t("trainer.profile.no_bio")}
            </Text>
          </View>

          {/* Social Links Sub-section */}
          {(profile?.social_links?.zalo ||
            profile?.social_links?.messenger ||
            profile?.social_links?.facebook) && (
            <View className="mt-2 pt-4 border-t border-border">
              <Text className="text-muted_foreground text-xs font-bold uppercase mb-3">
                {t("trainer.profile.social_links_title")}
              </Text>
              <View className="flex-row gap-3">
                {profile.social_links.zalo && (
                  <View className="bg-[#0068FF]/10 px-3 py-2 rounded-xl flex-row items-center border border-[#0068FF]/20">
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={16}
                      color="#0068FF"
                    />
                    <Text className="text-[#0068FF] text-xs font-bold ml-2">
                      Zalo
                    </Text>
                  </View>
                )}
                {profile.social_links.messenger && (
                  <View className="bg-[#0084FF]/10 px-3 py-2 rounded-xl flex-row items-center border border-[#0084FF]/20">
                    <Ionicons name="logo-facebook" size={16} color="#0084FF" />
                    <Text className="text-[#0084FF] text-xs font-bold ml-2">
                      Messenger
                    </Text>
                  </View>
                )}
                {profile.social_links.facebook && (
                  <View className="bg-slate-500/10 px-3 py-2 rounded-xl flex-row items-center border border-slate-500/20">
                    <Ionicons name="link-outline" size={16} color="#64748b" />
                    <Text className="text-slate-600 dark:text-slate-400 text-xs font-bold ml-2">
                      FB
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Actions List */}
        <View className="mb-6">
          <TouchableOpacity
            className="flex-row items-center bg-card p-4 rounded-xl mb-3 border border-border shadow-sm"
            onPress={() => router.push("/(trainer)/profile/edit")}
          >
            <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-3">
              <FontAwesome name="edit" size={20} color={colors.primary} />
            </View>
            <Text className="flex-1 text-foreground font-semibold text-lg">
              {t("trainer.profile.edit_btn")}
            </Text>
            <FontAwesome name="chevron-right" size={14} color={colors.border} />
          </TouchableOpacity>
        </View>

        {/* Language Selection (Like Settings) */}
        <Text className="text-foreground-secondary text-sm font-bold uppercase mb-4">
          {t("settings.language_label")}
        </Text>
        <View className="bg-card rounded-2xl overflow-hidden border border-border mb-8 shadow-sm">
          <TouchableOpacity
            onPress={() => changeLanguage("vi")}
            className="flex-row items-center justify-between p-4 border-b border-border"
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🇻🇳</Text>
              <Text className="text-foreground font-medium text-lg">
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

          <TouchableOpacity
            onPress={() => changeLanguage("en")}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🇬🇧</Text>
              <Text className="text-foreground font-medium text-lg">
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

        {/* Theme Selection (Also like settings, why not?) */}
        <Text className="text-foreground-secondary text-sm font-bold uppercase mb-4">
          {t("settings.theme.title")}
        </Text>
        <View className="bg-card rounded-2xl overflow-hidden border border-border mb-8 shadow-sm">
          <ThemeOption
            label={t("settings.theme.system")}
            value="system"
            icon="phone-portrait-outline"
          />
          <ThemeOption
            label={t("settings.theme.light")}
            value="light"
            icon="sunny-outline"
          />
          <ThemeOption
            label={t("settings.theme.dark")}
            value="dark"
            icon="moon-outline"
          />
        </View>

        <Button
          title={t("trainer.profile.sign_out")}
          onPress={handleSignOut}
          variant="secondary"
        />

        <Text className="text-muted_foreground text-xs mt-8 text-center pb-10">
          {t("profile.version")} 1.8.0 (Diamond)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
