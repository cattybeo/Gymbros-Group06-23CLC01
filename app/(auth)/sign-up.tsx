import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUp() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email || !password || !confirmPassword) {
      Alert.alert(t("common.error"), t("common.missing_info"));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t("common.error"), t("auth.password_mismatch"));
      return;
    }

    setLoading(true);

    // 1. Gọi Supabase Sign Up
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert(t("auth.sign_up_failed"), error.message);
    } else {
      // 2. Thông báo thành công
      Alert.alert(
        t("common.success"),
        t("auth.sign_up_success_msg"),
        [{ text: "OK", onPress: () => router.back() }] // Quay lại trang login
      );
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background px-6 justify-center">
      <View className="items-center mb-8">
        <Text className="text-3xl font-bold text-white">
          {t("auth.sign_up_title")}
        </Text>
        <Text className="text-gray-400 mt-2">{t("auth.sign_up_subtitle")}</Text>
      </View>

      <View>
        <InputField
          label={t("auth.email_label")}
          placeholder={t("auth.email_placeholder")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <InputField
          label={t("auth.password_label")}
          placeholder={t("auth.password_placeholder")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <InputField
          label={t("auth.confirm_password_label")}
          placeholder={t("auth.password_placeholder")}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <View className="mt-4">
          <Button
            title={t("auth.register_button")}
            onPress={handleSignUp}
            isLoading={loading}
          />
        </View>
      </View>

      <View className="flex-row justify-center mt-8">
        <Text className="text-gray-400">{t("auth.has_account")} </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary font-bold">{t("auth.login_now")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
