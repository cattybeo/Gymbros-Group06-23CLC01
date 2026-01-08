import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField"; // Using InputField for better consistency
import Colors from "@/constants/Colors";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrainerProfileEdit() {
  const { profile } = useAuthContext();
  const { colorScheme } = useThemeContext();
  const { t } = useTranslation();
  const colors = Colors[colorScheme];
  const { showAlert, CustomAlertComponent } = useCustomAlert();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [specialties, setSpecialties] = useState(
    profile?.specialties?.join(", ") || ""
  );
  const [experienceYears, setExperienceYears] = useState(
    profile?.experience_years?.toString() || ""
  );

  // Social Links state
  const [messenger, setMessenger] = useState(
    profile?.social_links?.messenger || ""
  );
  const [zalo, setZalo] = useState(profile?.social_links?.zalo || "");
  const [facebook, setFacebook] = useState(
    profile?.social_links?.facebook || ""
  );

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          bio,
          specialties: specialties
            .split(",")
            .map((s: string) => s.trim())
            .filter((s: string) => s !== ""),
          experience_years: experienceYears ? parseInt(experienceYears) : null,
          social_links: {
            messenger,
            zalo,
            facebook,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      showAlert(
        t("common.success"),
        t("trainer.profile.save_success"),
        "success",
        {
          onClose: () => router.back(),
        }
      );
    } catch (err: any) {
      showAlert(t("common.error"), err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <CustomAlertComponent />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 pt-2">
          <View className="mb-8">
            <Text className="text-3xl font-black text-foreground">
              {t("trainer.profile.edit_btn")}
            </Text>
          </View>

          <View className="space-y-4">
            <InputField
              label={t("trainer.profile.full_name")}
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. John Doe"
            />

            <InputField
              label={t("trainer.profile.bio")}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell about yourself..."
              multiline
              numberOfLines={4}
            />

            <InputField
              label={t("trainer.profile.specialty")}
              value={specialties}
              onChangeText={setSpecialties}
              placeholder="Yoga, HIIT, Cardio..."
              helperText="* Separate with commas"
            />

            <InputField
              label={t("trainer.profile.experience")}
              value={experienceYears}
              onChangeText={setExperienceYears}
              placeholder="e.g. 5"
              keyboardType="numeric"
            />

            <View className="mt-6">
              <Text className="text-foreground-secondary text-sm font-bold uppercase mb-4">
                {t("trainer.profile.social_links_title")}
              </Text>

              <InputField
                label={t("trainer.profile.zalo")}
                value={zalo}
                onChangeText={setZalo}
                placeholder="Phone number or Zalo ID"
              />

              <InputField
                label={t("trainer.profile.messenger")}
                value={messenger}
                onChangeText={setMessenger}
                placeholder="Messenger profile link"
              />

              <InputField
                label={t("trainer.profile.facebook")}
                value={facebook}
                onChangeText={setFacebook}
                placeholder="Facebook profile link"
              />
            </View>
          </View>

          <View className="mt-10 mb-20 space-y-3">
            <Button
              title={t("common.save")}
              onPress={handleSave}
              isLoading={loading}
            />
            <Button
              title={t("common.cancel")}
              onPress={() => router.back()}
              variant="secondary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Removing styles as we use NativeWind now
