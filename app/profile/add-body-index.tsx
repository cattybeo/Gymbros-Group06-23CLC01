import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
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
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!weight || !height) {
      Alert.alert(t("common.error"), t("common.missing_info"));
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // We need age/gender from previous record if not provided,
      // but for V1 let's just ask/require or default.
      // To keep it simple, we require inputs or fetch latest.
      // Let's assume user inputs for now.

      const { error } = await supabase.from("body_indices").insert({
        user_id: user.id,
        weight: parseFloat(weight),
        height: parseFloat(height),
        age: age ? parseInt(age) : 25, // Fallback or fetch logic could be here
        gender: "Male", // Fallback, ideally we fetch user profile
        goal: "Maintain",
        record_day: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      router.replace("/profile/body-index");
    } catch (error: any) {
      Alert.alert(t("common.error"), error.message);
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
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">
              {t("profile.add_record")}
            </Text>
          </View>

          <View className="bg-surface p-6 rounded-2xl border border-gray-800">
            <InputField
              label={t("onboarding.weight_label") + " (kg)"}
              placeholder="0.0"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
            <InputField
              label={t("onboarding.height_label") + " (cm)"}
              placeholder="0"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />
            <InputField
              label={t("onboarding.age_label") + " (Optional)"}
              placeholder="25"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>
        </ScrollView>

        <View className="p-4 border-t border-gray-800">
          <Button
            title={t("common.save")}
            onPress={handleSave}
            isLoading={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
