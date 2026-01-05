import Colors from "@/constants/Colors";
import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
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
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker, { DateType } from "react-native-ui-datepicker";

export default function EditProfileScreen() {
  const { user } = useAuthContext();
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();

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
      Alert.alert(t("common.error"), t("common.pick_image_error"));
    }
  };

  const uploadAvatar = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploading(true);
      if (!user) throw new Error("No user on the session!");

      const base64 = imageAsset.base64;
      if (!base64) throw new Error("No image data found.");

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
      Alert.alert(t("common.error"), error.message);
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
      Alert.alert(t("common.error"), error.message);
    } else {
      Alert.alert(t("common.success"), t("profile.update_success_msg"));
      router.back();
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
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-4 w-10 h-10 items-center justify-center rounded-full bg-gray-800"
        >
          <FontAwesome name="arrow-left" size={20} color="white" />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-white mb-8">
          {t("profile.edit_profile")}
        </Text>

        {/* Avatar Section */}
        <View className="items-center mb-8">
          <TouchableOpacity
            onPress={pickImage}
            disabled={uploading}
            className="relative"
          >
            <View className="w-24 h-24 rounded-full bg-gray-700 items-center justify-center overflow-hidden border-2 border-gray-600">
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-3xl font-bold text-gray-400">
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
            <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center border-2 border-background">
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </TouchableOpacity>
          <Text className="text-gray-400 text-sm mt-3">
            {uploading ? t("common.uploading") : t("profile.change_avatar")}
          </Text>
        </View>

        <View className="space-y-10">
          {/* Section 1: Personal Details */}
          <View className="space-y-6">
            <Text className="text-white text-xl font-bold opacity-90 border-b border-gray-800 pb-2">
              {t("profile.personal_details")}
            </Text>

            {/* Name */}
            <View>
              <Text className="text-gray-400 mb-2 font-medium">
                {t("auth.name_label") || "Full Name"}
              </Text>
              <TextInput
                className="bg-surface p-4 rounded-xl text-white border border-gray-700 focus:border-primary"
                value={fullName}
                onChangeText={setFullName}
                placeholder={t("auth.name_placeholder")}
                placeholderTextColor="#6B7280"
              />
            </View>

            {/* Email */}
            <View>
              <Text className="text-gray-400 mb-2 font-medium">
                {t("auth.email_label")}
              </Text>
              <View className="bg-gray-800 p-4 rounded-xl border border-gray-700 opacity-50">
                <Text className="text-gray-400">{user?.email}</Text>
              </View>
              <Text className="text-gray-500 text-xs mt-1 italic">
                {t("profile.email_change_notice")}
              </Text>
            </View>

            {/* Gender Selector */}
            <View>
              <Text className="text-gray-400 mb-2 font-medium">
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
                        : "bg-gray-800 border-gray-700"
                    }`}
                  >
                    <Text
                      className={`${
                        gender === g ? "text-white font-bold" : "text-gray-400"
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
              <Text className="text-gray-400 mb-2 font-medium">
                {t("profile.birthday_label")}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setTempDate(birthday || dayjs());
                  setShowDatePicker(true);
                }}
                className="bg-surface p-4 rounded-xl border border-gray-700 flex-row justify-between items-center"
              >
                <Text
                  className={`${birthday ? "text-white" : "text-gray-500"}`}
                >
                  {birthday
                    ? dayjs(birthday).format("YYYY-MM-DD")
                    : "YYYY-MM-DD"}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              {/* Data Picker Modal (Keep existing code structure implicitly via replace if possible, but here we are replacing a large chunk) */}
              <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View className="flex-1 justify-center items-center bg-black/80 p-4">
                  <View className="bg-surface w-full max-w-sm rounded-3xl p-6 border border-gray-700">
                    <Text className="text-white text-xl font-bold mb-4 text-center">
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
                            color: "black",
                            fontWeight: "bold",
                          },
                          day_label: { color: "white" },
                          year_label: { color: "white", fontWeight: "bold" },
                          month_label: { color: "white", fontWeight: "bold" },
                          month_selector_label: {
                            color: "white",
                            fontSize: 16,
                            fontWeight: "bold",
                          },
                          year_selector_label: {
                            color: "white",
                            fontSize: 16,
                            fontWeight: "bold",
                          },
                          weekday_label: { color: "#9CA3AF" },
                        }}
                        components={{
                          IconPrev: (
                            <Ionicons
                              name="chevron-back"
                              size={20}
                              color="white"
                            />
                          ),
                          IconNext: (
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color="white"
                            />
                          ),
                        }}
                      />
                    </View>

                    <View className="flex-row gap-4">
                      <TouchableOpacity
                        onPress={() => setShowDatePicker(false)}
                        className="flex-1 py-3 rounded-xl bg-gray-800 border border-gray-700 items-center"
                      >
                        <Text className="text-gray-300 font-bold">
                          {t("common.cancel") || "Cancel"}
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
                        <Text className="text-black font-bold">
                          {t("common.confirm") || "Confirm"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </View>
          </View>

          {/* Section 2: Fitness Goals */}
          <View className="space-y-6">
            <Text className="text-white text-xl font-bold opacity-90 border-b border-gray-800 pb-2">
              {t("profile.fitness_profile")}
            </Text>

            <View>
              <Text className="text-gray-400 mb-3 font-medium">
                {t("profile.goal_label")}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {GOAL_OPTIONS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGoal(g)}
                    className={`px-4 py-2 rounded-full border ${
                      goal === g
                        ? "bg-primary border-primary"
                        : "bg-gray-800 border-gray-700"
                    }`}
                  >
                    <Text
                      className={`${
                        goal === g ? "text-white font-bold" : "text-gray-400"
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
              <Text className="text-gray-400 mb-3 font-medium">
                {t("profile.activity_level_label")}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {ACTIVITY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setActivityLevel(opt)}
                    className={`px-4 py-2 rounded-full border ${
                      activityLevel === opt
                        ? "bg-primary border-primary"
                        : "bg-gray-800 border-gray-700"
                    }`}
                  >
                    <Text
                      className={`${
                        activityLevel === opt
                          ? "text-white font-bold"
                          : "text-gray-400"
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
              <Text className="text-gray-400 mb-3 font-medium">
                {t("profile.experience_level_label")}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setExperienceLevel(opt)}
                    className={`px-4 py-2 rounded-full border ${
                      experienceLevel === opt
                        ? "bg-primary border-primary"
                        : "bg-gray-800 border-gray-700"
                    }`}
                  >
                    <Text
                      className={`${
                        experienceLevel === opt
                          ? "text-white font-bold"
                          : "text-gray-400"
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
              <Text className="text-gray-400 mb-3 font-medium">
                {t("profile.weekly_availability_label")}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setWeeklyAvailability(opt)}
                    className={`px-4 py-2 rounded-full border ${
                      weeklyAvailability === opt
                        ? "bg-primary border-primary"
                        : "bg-gray-800 border-gray-700"
                    }`}
                  >
                    <Text
                      className={`${
                        weeklyAvailability === opt
                          ? "text-white font-bold"
                          : "text-gray-400"
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
            loading ? "bg-gray-700" : "bg-primary"
          }`}
          onPress={handleUpdate}
          disabled={loading}
        >
          <Text className="text-white font-bold text-lg">
            {loading
              ? t("membership.processing")
              : t("common.save") || "Save Changes"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
