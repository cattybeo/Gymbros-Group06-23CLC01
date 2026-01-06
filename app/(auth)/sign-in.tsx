import Button from "@/components/ui/Button";
import GoogleSignInButton from "@/components/ui/GoogleSignInButton";
import InputField from "@/components/ui/InputField";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignIn() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showAlert, CustomAlertComponent } = useCustomAlert();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      showAlert(t("common.error"), t("common.missing_info"), "error");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      showAlert(t("common.error"), error.message, "error");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background px-6 justify-center">
      {/* Header / Logo */}
      <Animated.View
        className="items-center mb-8"
        entering={FadeInDown.delay(200).springify()}
      >
        <View className="w-20 h-20 bg-card rounded-full items-center justify-center mb-4 border border-border">
          <Text className="text-4xl">💪</Text>
        </View>
        <Text className="text-3xl font-bold text-foreground">
          {t("auth.welcome_back")}
        </Text>
        <Text className="text-foreground-muted mt-2 text-center">
          {t("auth.login_subtitle")}
        </Text>
      </Animated.View>

      {/* Form */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(1000).springify()}
      >
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

        <View className="mt-4">
          <Button
            title={t("auth.login_button")}
            onPress={handleSignIn}
            isLoading={loading}
          />
        </View>
      </Animated.View>

      {/* Footer Nav & OAuth */}
      <Animated.View
        entering={FadeInUp.delay(600).duration(1000).springify()}
        className="mt-8"
      >
        <View className="flex-row justify-center mb-8">
          <Text className="text-foreground-muted">{t("auth.no_account")} </Text>
          <TouchableOpacity onPress={() => router.push("/sign-up")}>
            <Text className="text-primary font-bold">
              {t("auth.register_now")}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-[1px] bg-border" />
          <Text className="mx-4 text-foreground-muted">
            {t("auth.or_continue")}
          </Text>
          <View className="flex-1 h-[1px] bg-border" />
        </View>

        <GoogleSignInButton />
      </Animated.View>
      <CustomAlertComponent />
    </SafeAreaView>
  );
}
