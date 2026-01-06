import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import Colors from "@/constants/Colors";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Screen for adding new body index record
export default function AddBodyIndexScreen() {
  const { t } = useTranslation();
  const { showAlert, CustomAlertComponent } = useCustomAlert();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!weight || !height) {
      showAlert(t("common.error"), t("common.missing_info"), "error");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch gender from user metadata with fallback
      const userGender = user?.user_metadata?.gender || "male";

      // Fetch age from user metadata if not provided
      const userAge =
        age || user?.user_metadata?.birthday
          ? new Date().getFullYear() -
            new Date(user.user_metadata.birthday).getFullYear()
          : 25;

      const { error } = await supabase.from("body_indices").insert({
        user_id: user.id,
        weight: parseFloat(weight),
        height: parseFloat(height),
        age: userAge,
        gender: userGender,
        goal: "Maintain",
        record_day: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      router.replace("/profile/body-index");
    } catch (error: any) {
      showAlert(t("common.error"), error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="px-4 pt-2">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center bg-surface rounded-full mr-4"
            >
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text className="text-foreground text-xl font-bold">
              {t("profile.add_record")}
            </Text>
          </View>

          <View className="bg-surface p-6 rounded-2xl border border-border">
            <InputField
              label={t("onboarding.weight_label")}
              placeholder="0.0"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
            <InputField
              label={t("onboarding.height_label")}
              placeholder="0"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />
            <InputField
              label={`${t("onboarding.age_label")} (${t("common.optional")})`}
              placeholder="25"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>
        </ScrollView>

        <View className="p-4 border-t border-border">
          <Button
            title={t("common.save")}
            onPress={handleSave}
            isLoading={loading}
          />
        </View>
      </KeyboardAvoidingView>
      <CustomAlertComponent />
    </SafeAreaView>
  );
}
