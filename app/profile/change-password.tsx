import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

export default function ChangePasswordScreen() {
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !user.email) return;

    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert(t("common.error"), t("common.missing_info"));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t("common.error"), t("auth.password_mismatch"));
      return;
    }

    setLoading(true);

    try {
      // 1. Verify Old Password by trying to Sign In
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (signInError) {
        Alert.alert(t("common.error"), t("auth.password_incorrect"));
        setLoading(false);
        return;
      }

      // 2. Update Password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      Alert.alert(t("common.success"), t("profile.change_password_success"), [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert(t("common.error"), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1 px-6 pt-12">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-6 w-10 h-10 items-center justify-center rounded-full bg-gray-800"
        >
          <FontAwesome name="arrow-left" size={20} color="white" />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-white mb-8">
          {t("auth.change_password")}
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="text-gray-400 mb-2 font-medium">
              {t("auth.old_password")}
            </Text>
            <TextInput
              className="bg-surface p-4 rounded-xl text-white border border-gray-700 focus:border-primary"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
              placeholder="••••••"
              placeholderTextColor="#6B7280"
            />
          </View>

          <View>
            <Text className="text-gray-400 mb-2 font-medium">
              {t("auth.new_password")}
            </Text>
            <TextInput
              className="bg-surface p-4 rounded-xl text-white border border-gray-700 focus:border-primary"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="••••••"
              placeholderTextColor="#6B7280"
            />
          </View>

          <View>
            <Text className="text-gray-400 mb-2 font-medium">
              {t("auth.confirm_password_label")}
            </Text>
            <TextInput
              className="bg-surface p-4 rounded-xl text-white border border-gray-700 focus:border-primary"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="••••••"
              placeholderTextColor="#6B7280"
            />
          </View>
        </View>

        <TouchableOpacity
          className={`mt-8 w-full py-4 rounded-xl items-center ${
            loading ? "bg-gray-700" : "bg-primary"
          }`}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white font-bold text-lg">
            {loading ? t("membership.processing") : t("common.save")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
