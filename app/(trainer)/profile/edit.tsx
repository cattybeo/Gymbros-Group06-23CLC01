import Button from "@/components/ui/Button";
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
  StyleSheet,
  Text,
  TextInput,
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <CustomAlertComponent />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("trainer.profile.edit_btn")}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground_muted }]}>
              {t("trainer.profile.full_name") || "Full Name"}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. John Doe"
              placeholderTextColor={colors.foreground_muted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground_muted }]}>
              {t("trainer.profile.bio") || "Bio"}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  color: colors.text,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell about yourself..."
              placeholderTextColor={colors.foreground_muted}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground_muted }]}>
              {t("trainer.profile.specialty") || "Specialties"}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              value={specialties}
              onChangeText={setSpecialties}
              placeholder="Yoga, HIIT, Cardio..."
              placeholderTextColor={colors.foreground_muted}
            />
            <Text
              style={{
                fontSize: 12,
                color: colors.foreground_muted,
                marginTop: 4,
              }}
            >
              * Separate with commas
            </Text>
          </View>

          <View style={{ marginTop: 20, gap: 12 }}>
            <Button
              title={t("common.save") || "Save Changes"}
              onPress={handleSave}
              isLoading={loading}
            />
            <Button
              title={t("common.cancel") || "Cancel"}
              onPress={() => router.back()}
              variant="secondary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: "bold" },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, marginBottom: 8, fontWeight: "600" },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
});
