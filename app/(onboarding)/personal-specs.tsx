import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
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

// Options matching EditProfile
const GOAL_OPTIONS = [
  "lose_weight",
  "build_muscle",
  "maintain",
  "endurance",
  "flexibility",
];
const ACTIVITY_OPTIONS = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
];
const GENDER_OPTIONS = ["male", "female", "other"];
const EXPERIENCE_OPTIONS = ["beginner", "intermediate", "advanced"];

export default function PersonalSpecsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showAlert, CustomAlertComponent } = useCustomAlert();

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [goal, setGoal] = useState("lose_weight");
  const [activityLevel, setActivityLevel] = useState("sedentary");
  const [experienceLevel, setExperienceLevel] = useState("beginner");

  const [loading, setLoading] = useState(false);

  async function handleNext() {
    if (!height || !weight || !age) {
      showAlert(t("common.error"), t("common.missing_info"), "error");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showAlert(t("common.error"), t("auth.user_not_found"), "error");
        return;
      }

      // 1. Insert into body_indices (History)
      const { error: dbError } = await supabase.from("body_indices").insert({
        user_id: user.id,
        height: parseFloat(height),
        weight: parseFloat(weight),
        age: parseInt(age),
        gender,
        goal,
        record_day: new Date().toISOString().split("T")[0],
      });

      if (dbError) throw dbError;

      // 2. Update Profiles Table (Canonical Source)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          gender,
          goal,
          activity_level: activityLevel,
          experience_level: experienceLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Navigate to Home (Root determines role-based path)
      router.replace("/");
    } catch (error: any) {
      showAlert(t("common.error"), error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-8 mt-4">
            <Text className="text-3xl font-bold text-foreground mb-2">
              {t("onboarding.title")}
            </Text>
            <Text className="text-foreground-secondary">
              {t("onboarding.subtitle")}
            </Text>
          </View>

          {/* 1. Basic Info */}
          <Text className="text-foreground font-bold text-lg mb-4">
            {t("profile.personal_details")}
          </Text>

          <Text className="text-foreground-secondary mb-2 font-medium">
            {t("profile.gender_label")}
          </Text>
          <View className="flex-row gap-3 mb-6">
            {GENDER_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGender(g)}
                className={`flex-1 items-center py-3 rounded-xl border ${
                  gender === g
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`font-bold capitalize ${
                    gender === g
                      ? "text-on_primary"
                      : "text-foreground-secondary"
                  }`}
                >
                  {t(`profile.genders.${g}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="flex-row gap-4 mb-6">
            <View className="flex-1">
              <InputField
                label={t("onboarding.age_label")}
                placeholder={t("onboarding.age_placeholder")}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <InputField
                label={t("onboarding.height_label")}
                placeholder={t("onboarding.height_placeholder")}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <InputField
                label={t("onboarding.weight_label")}
                placeholder={t("onboarding.weight_placeholder")}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* 2. Goals */}
          <Text className="text-foreground font-bold text-lg mb-4 mt-2">
            {t("profile.fitness_profile")}
          </Text>

          <Text className="text-foreground-secondary mb-3 font-medium">
            {t("profile.goal_label")}
          </Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {GOAL_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGoal(g)}
                className={`px-4 py-2 rounded-full border ${
                  goal === g
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`font-medium ${
                    goal === g ? "text-on_primary" : "text-foreground-secondary"
                  }`}
                >
                  {t(`profile.goals.${g}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-foreground-secondary mb-3 font-medium">
            {t("profile.activity_level_label")}
          </Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {ACTIVITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => setActivityLevel(opt)}
                className={`px-4 py-2 rounded-full border ${
                  activityLevel === opt
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`font-medium ${
                    activityLevel === opt
                      ? "text-on_primary"
                      : "text-foreground-secondary"
                  }`}
                >
                  {t(`profile.activities.${opt}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-foreground-secondary mb-3 font-medium">
            {t("profile.experience_level_label")}
          </Text>
          <View className="flex-row flex-wrap gap-3 mb-8">
            {EXPERIENCE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => setExperienceLevel(opt)}
                className={`px-4 py-2 rounded-full border ${
                  experienceLevel === opt
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`font-medium ${
                    experienceLevel === opt
                      ? "text-on_primary"
                      : "text-foreground-secondary"
                  }`}
                >
                  {t(`profile.experiences.${opt}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="mb-10">
            <Button
              title={t("onboarding.next_button")}
              onPress={handleNext}
              isLoading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomAlertComponent />
    </SafeAreaView>
  );
}
