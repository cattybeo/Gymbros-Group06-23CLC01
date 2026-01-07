import Button from "@/components/ui/Button";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrainerProfile() {
  const { profile } = useAuthContext();
  const { colorScheme } = useThemeContext();
  const { t, i18n } = useTranslation();
  const colors = Colors[colorScheme];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/sign-in");
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "vi" ? "en" : "vi";
    i18n.changeLanguage(newLang);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: colors.text,
            marginBottom: 24,
          }}
        >
          {t("trainer.profile.title")}
        </Text>

        <View style={{ alignItems: "center", marginBottom: 30 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.primary_light,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <FontAwesome name="user-circle" size={80} color={colors.primary} />
          </View>
          <Text
            style={{ fontSize: 22, fontWeight: "bold", color: colors.text }}
          >
            {profile?.full_name}
          </Text>
          <Text style={{ color: colors.foreground_muted }}>
            {profile?.email}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 24,
          }}
        >
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.foreground_muted, fontSize: 13 }}>
              {t("trainer.profile.specialty")}
            </Text>
            <Text
              style={{ fontSize: 16, color: colors.text, fontWeight: "600" }}
            >
              {profile?.specialties?.join(", ") ||
                t("trainer.profile.no_specialties")}
            </Text>
          </View>

          <View>
            <Text style={{ color: colors.foreground_muted, fontSize: 13 }}>
              {t("trainer.profile.bio")}
            </Text>
            <Text style={{ fontSize: 14, color: colors.text, marginTop: 4 }}>
              {profile?.bio || t("trainer.profile.no_bio")}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            backgroundColor: colors.card,
            borderRadius: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={() => router.push("/(trainer)/profile/edit")}
        >
          <FontAwesome name="edit" size={20} color={colors.primary} />
          <Text
            style={{
              flex: 1,
              marginLeft: 12,
              color: colors.text,
              fontWeight: "600",
            }}
          >
            {t("trainer.profile.edit_btn")}
          </Text>
          <FontAwesome name="chevron-right" size={14} color={colors.border} />
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            backgroundColor: colors.card,
            borderRadius: 12,
            marginBottom: 30,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={toggleLanguage}
        >
          <FontAwesome name="globe" size={20} color={colors.primary} />
          <Text
            style={{
              flex: 1,
              marginLeft: 12,
              color: colors.text,
              fontWeight: "600",
            }}
          >
            {t("trainer.profile.language")}
          </Text>
          <Text style={{ color: colors.foreground_muted, marginRight: 8 }}>
            {i18n.language === "vi" ? "Tiếng Việt" : "English"}
          </Text>
          <FontAwesome name="chevron-right" size={14} color={colors.border} />
        </TouchableOpacity>

        <Button
          title={t("trainer.profile.sign_out")}
          onPress={handleSignOut}
          variant="secondary"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
