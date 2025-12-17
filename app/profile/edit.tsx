import Colors from "@/constants/Colors";
import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

export default function EditProfileScreen() {
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [avatarUrl, setAvatarUrl] = useState(
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ""
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

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
      Alert.alert(t("common.error"), "Could not pick image.");
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
      data: { full_name: fullName, avatar_url: avatarUrl },
    });

    if (error) {
      Alert.alert(t("common.error"), error.message);
    } else {
      Alert.alert(t("common.success"), t("profile.update_success_msg")); // need to add key
      router.back();
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1 px-6 pt-12">
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-6 w-10 h-10 items-center justify-center rounded-full bg-gray-800"
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
            {uploading ? "Uploading..." : t("profile.change_avatar")}
          </Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-gray-400 mb-2 font-medium">
              {t("auth.name_label") || "Full Name"}
            </Text>
            <TextInput
              className="bg-surface p-4 rounded-xl text-white border border-gray-700 focus:border-primary"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ex: John Doe"
              placeholderTextColor="#6B7280"
            />
          </View>

          <View>
            <Text className="text-gray-400 mb-2 font-medium">Email</Text>
            <View className="bg-gray-800 p-4 rounded-xl border border-gray-700 opacity-50">
              <Text className="text-gray-400">{user?.email}</Text>
            </View>
            <Text className="text-gray-500 text-xs mt-1 italic">
              {t("profile.email_change_notice")}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className={`mt-8 w-full py-4 rounded-xl items-center ${
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
