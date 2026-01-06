import Colors from "@/constants/Colors";
import { useCustomAlert } from "@/hooks/useCustomAlert"; // Import Hook
import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/vi";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker, { DateType } from "react-native-ui-datepicker";

export default function EditProfileScreen() {
  const { user } = useAuthContext();
  const { t, i18n } = useTranslation();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const { showAlert, CustomAlertComponent } = useCustomAlert();

  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [avatarUrl, setAvatarUrl] = useState(
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ""
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Profile 2.0 State
  const [goal, setGoal] = useState<string>(
    user?.user_metadata?.goal || "maintain"
  );
  const [gender, setGender] = useState<string>(
    user?.user_metadata?.gender || "male"
  );
  const [birthday, setBirthday] = useState<Date | null>(
    user?.user_metadata?.birthday ? new Date(user.user_metadata.birthday) : null
  );
  const [activityLevel, setActivityLevel] = useState<string>(
    user?.user_metadata?.activity_level || "sedentary"
  );
  const [experienceLevel, setExperienceLevel] = useState<string>(
    user?.user_metadata?.experience_level || "beginner"
  );
  const [weeklyAvailability, setWeeklyAvailability] = useState<string>(
    user?.user_metadata?.weekly_availability || "1_2"
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<DateType>(dayjs());

  const GOAL_OPTIONS = [
    "lose_weight",
    "build_muscle",
    "maintain",
    "endurance",
    "flexibility",
  ];
  const GENDER_OPTIONS = ["male", "female", "other"];
  const ACTIVITY_OPTIONS = [
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ];
  const EXPERIENCE_OPTIONS = ["beginner", "intermediate", "advanced"];
  const AVAILABILITY_OPTIONS = ["1_2", "3_4", "5_plus"];

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageAsset = result.assets[0];

        // Optimistic update for UI (using the local URI temporarily if needed,
        // but we'll upload immediately)
        // setAvatarUrl(imageAsset.uri);

        await uploadAvatar(imageAsset);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showAlert(t("common.error"), t("common.pick_image_error"), "error");
    }
  };

  const uploadAvatar = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploading(true);
      if (!user) throw new Error(t("profile.error_no_session"));

      const base64 = imageAsset.base64;
      if (!base64) throw new Error(t("profile.error_no_image"));

      const fileExt = imageAsset.uri.split(".").pop()?.toLowerCase() || "jpeg";
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, decode(base64), {
          contentType: imageAsset.mimeType || "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      if (data) {
        setAvatarUrl(data.publicUrl);
        // We also need to update the user metadata immediately so it persists
        // independently of the "Save Changes" button, OR we can let "Save Changes" do it.
        // Usually, users expect Avatar to update immediately.
        await updateUserMetadata(data.publicUrl);
      }
    } catch (error: any) {
      showAlert(t("common.error"), error.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const updateUserMetadata = async (url: string) => {
    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: url },
    });
    if (error) {
      console.error("Error updating user avatar:", error);
    }
  };

  const handleUpdate = async () => {
    if (!user) return;

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        avatar_url: avatarUrl,
        goal,
        gender,
        birthday: birthday ? birthday.toISOString().split("T")[0] : null,
        activity_level: activityLevel,
        experience_level: experienceLevel,
        weekly_availability: weeklyAvailability,
      },
    });

    if (error) {
      showAlert(t("common.error"), error.message, "error");
    } else {
      showAlert(
        t("common.success"),
        t("profile.update_success_msg"),
        "success",
        { onClose: () => router.back() }
      );
    }
    setLoading(false);
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
          paddingBottom: insets.bottom + 60,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-6 w-10 h-10 items-center justify-center rounded-full bg-surface border border-border"
        >
          <FontAwesome name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-text mb-10">
          {t("profile.edit_profile")}
        </Text>

        {/* Avatar Section */}
        <View className="items-center mb-12">
          <TouchableOpacity
            onPress={pickImage}
            disabled={uploading}
            className="relative"
          >
            <View className="w-28 h-28 rounded-full bg-surface items-center justify-center overflow-hidden border-2 border-border">
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-4xl font-bold text-text_secondary">
                  {fullName
                    ? fullName.charAt(0).toUpperCase()
                    : user?.email?.charAt(0).toUpperCase()}
                </Text>
              )}
              {uploading && (
                <View className="absolute inset-0 bg-black/50 items-center justify-center">
                  <ActivityIndicator color={Colors.light.tint} />
                </View>
              )}
            </View>
            <View className="absolute bottom-0 right-0 bg-primary w-9 h-9 rounded-full items-center justify-center border-2 border-background">
              <Ionicons name="camera" size={18} color="white" />
            </View>
          </TouchableOpacity>
          <Text className="text-text_secondary text-sm mt-4">
            {uploading ? t("common.uploading") : t("profile.change_avatar")}
          </Text>
        </View>

        <View className="space-y-12 gap-4">
          {/* Section 1: Personal Details */}
          <View className="space-y-8 gap-3">
            <Text className="text-text text-xl font-bold opacity-90 border-b border-border pb-3">
              {t("profile.personal_details")}
            </Text>

            {/* Name */}
            <View>
              <Text className="text-text_secondary mb-3 font-medium">
                {t("auth.name_label")}
              </Text>
              <TextInput
                className="bg-surface p-4 rounded-xl text-text border border-border focus:border-primary"
                value={fullName}
                onChangeText={setFullName}
                placeholder={t("auth.name_placeholder")}
                placeholderTextColor={colors.muted_foreground}
              />
            </View>

            {/* Email */}
            <View>
              <Text className="text-text_secondary mb-3 font-medium">
                {t("auth.email_label")}
              </Text>
              <View className="bg-surface p-4 rounded-xl border border-border opacity-50">
                <Text className="text-text_secondary">{user?.email}</Text>
              </View>
              <Text className="text-text_secondary text-xs mt-2 italic">
                {t("profile.email_change_notice")}
              </Text>
            </View>

            {/* Gender Selector */}
            <View>
              <Text className="text-text_secondary mb-4 font-medium">
                {t("profile.gender_label")}
              </Text>
              <View className="flex-row gap-3">
                {GENDER_OPTIONS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    className={`flex-1 py-3 rounded-xl border items-center ${
                      gender === g
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`${
                        gender === g
                          ? "text-primary-foreground font-bold"
                          : "text-text_secondary"
                      }`}
                    >
                      {t(`profile.genders.${g}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Birthday */}
            <View>
              <Text className="text-text_secondary mb-4 font-medium">
                {t("profile.birthday_label")}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setTempDate(birthday || dayjs());
                  setShowDatePicker(true);
                }}
                className="bg-surface p-4 rounded-xl border border-border flex-row justify-between items-center"
              >
                <Text
                  className={`${birthday ? "text-text" : "text-text_secondary"}`}
                >
                  {birthday
                    ? dayjs(birthday).format("YYYY-MM-DD")
                    : "YYYY-MM-DD"}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.text}
                />
              </TouchableOpacity>

              {/* Data Picker Modal */}
              <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View className="flex-1 justify-center items-center bg-black/80 p-4">
                  <View className="bg-surface w-full max-w-sm rounded-3xl p-6 border border-border">
                    <Text className="text-text text-xl font-bold mb-4 text-center">
                      {t("profile.birthday_label")}
                    </Text>

                    <View className="bg-background rounded-2xl p-2 mb-6">
                      <DateTimePicker
                        locale={i18n.language}
                        mode="single"
                        date={tempDate}
                        onChange={(params: any) => setTempDate(params.date)}
                        maxDate={dayjs().toDate()}
                        styles={{
                          selected: { backgroundColor: colors.tint },
                          selected_label: {
                            color: colors.background,
                            fontWeight: "bold",
                          },
                          day_label: { color: colors.text },
                          year_label: {
                            color: colors.text,
                            fontWeight: "bold",
                          },
                          month_label: {
                            color: colors.text,
                            fontWeight: "bold",
                          },
                          month_selector_label: {
                            color: colors.text,
                            fontSize: 16,
                            fontWeight: "bold",
                          },
                          year_selector_label: {
                            color: colors.text,
                            fontSize: 16,
                            fontWeight: "bold",
                          },
                          weekday_label: { color: colors.muted_foreground },
                        }}
                        components={{
                          IconPrev: (
                            <Ionicons
                              name="chevron-back"
                              size={20}
                              color={colors.text}
                            />
                          ),
                          IconNext: (
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color={colors.text}
                            />
                          ),
                        }}
                      />
                    </View>

                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        className="flex-1 py-3 rounded-xl bg-surface border border-border items-center"
                      >
                        <Text className="text-text_secondary font-bold">
                          {t("common.cancel")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          if (tempDate) {
                            setBirthday(dayjs(tempDate).toDate());
                          }
                          setShowDatePicker(false);
                        }}
                        className="flex-1 py-3 rounded-xl bg-primary items-center"
                      >
                        <Text className="text-primary-foreground font-bold">
                          {t("common.confirm")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </View>
          </View>

          {/* Section 2: Fitness Goals */}
          <View className="space-y-10 gap-3">
            <Text className="text-text text-xl font-bold opacity-90 border-b border-border pb-3">
              {t("profile.fitness_profile")}
            </Text>

            <View>
              <Text className="text-text_secondary mb-4 font-medium">
                {t("profile.goal_label")}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {GOAL_OPTIONS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGoal(g)}
                    className={`px-5 py-3 rounded-full border ${
                      goal === g
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`${
                        goal === g
                          ? "text-primary-foreground font-bold"
                          : "text-text_secondary"
                      }`}
                    >
                      {t(`profile.goals.${g}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* AI Data: Activity Level */}
            <View>
              <Text className="text-text_secondary mb-4 font-medium">
                {t("profile.activity_level_label")}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {ACTIVITY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setActivityLevel(opt)}
                    className={`px-5 py-3 rounded-full border ${
                      activityLevel === opt
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`${
                        activityLevel === opt
                          ? "text-primary-foreground font-bold"
                          : "text-text_secondary"
                      }`}
                    >
                      {t(`profile.activities.${opt}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* AI Data: Experience Level */}
            <View>
              <Text className="text-text_secondary mb-4 font-medium">
                {t("profile.experience_level_label")}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setExperienceLevel(opt)}
                    className={`px-5 py-3 rounded-full border ${
                      experienceLevel === opt
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`${
                        experienceLevel === opt
                          ? "text-primary-foreground font-bold"
                          : "text-text_secondary"
                      }`}
                    >
                      {t(`profile.experiences.${opt}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* AI Data: Weekly Availability */}
            <View>
              <Text className="text-text_secondary mb-4 font-medium">
                {t("profile.weekly_availability_label")}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setWeeklyAvailability(opt)}
                    className={`px-5 py-3 rounded-full border ${
                      weeklyAvailability === opt
                        ? "bg-primary border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <Text
                      className={`${
                        weeklyAvailability === opt
                          ? "text-primary-foreground font-bold"
                          : "text-text_secondary"
                      }`}
                    >
                      {t(`profile.availabilities.${opt}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          className={`mt-10 w-full py-4 rounded-xl items-center ${
            loading ? "bg-surface_highlight opacity-50" : "bg-primary"
          }`}
          onPress={handleUpdate}
          disabled={loading}
        >
          <Text className="text-primary-foreground font-bold text-lg">
            {loading ? t("membership.processing") : t("common.save")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Alert Modal */}
      <CustomAlertComponent />
    </KeyboardAvoidingView>
  );
}
