import Colors from "@/constants/Colors";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChangePasswordScreen() {
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();

  const { showAlert, CustomAlertComponent } = useCustomAlert(); // Use Hook

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert(t("common.error"), t("common.missing_info"), "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert(t("common.error"), t("auth.password_mismatch"), "error");
      return;
    }

    setLoading(true);
    try {
      if (!user?.email) throw new Error("User email not found");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        showAlert(t("common.error"), t("auth.password_incorrect"), "error");
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      showAlert(
        t("common.success"),
        t("profile.change_password_success"),
        "success",
        { onClose: () => router.back() }
      );
    } catch (error: any) {
      showAlert(t("common.error"), error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{
          paddingTop: insets.top + 30,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-8 w-10 h-10 items-center justify-center rounded-full bg-card border border-border"
        >
          <FontAwesome
            name="arrow-left"
            size={20}
            color={colorScheme === "dark" ? "#FFF" : "#000"}
          />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-foreground mb-8">
          {t("profile.change_password")}
        </Text>

        <View className="space-y-6">
          <View>
            <Text className="text-muted_foreground mb-2 font-medium">
              {t("auth.current_password")}
            </Text>
            <TextInput
              className="bg-card p-4 rounded-xl text-foreground border border-input focus:border-ring"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••"
              placeholderTextColor={colors.muted_foreground}
            />
          </View>

          <View>
            <Text className="text-muted_foreground mb-2 font-medium">
              {t("auth.new_password")}
            </Text>
            <TextInput
              className="bg-card p-4 rounded-xl text-foreground border border-input focus:border-ring"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••"
              placeholderTextColor={colors.muted_foreground}
            />
          </View>

          <View>
            <Text className="text-muted_foreground mb-2 font-medium">
              {t("auth.confirm_password")}
            </Text>
            <TextInput
              className="bg-card p-4 rounded-xl text-foreground border border-input focus:border-ring"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••"
              placeholderTextColor={colors.muted_foreground}
            />
          </View>
        </View>

        <TouchableOpacity
          className={`mt-10 w-full py-4 rounded-xl items-center ${
            loading ? "bg-secondary" : "bg-primary"
          }`}
          onPress={handleChangePassword}
          disabled={loading}
        >
          <Text
            className={`${loading ? "text-secondary_foreground" : "text-primary_foreground"} font-bold text-lg`}
          >
            {loading ? t("common.processing") : t("common.confirm")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <CustomAlertComponent />
    </KeyboardAvoidingView>
  );
}
