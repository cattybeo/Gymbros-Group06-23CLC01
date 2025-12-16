import Colors from "@/constants/Colors";
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

export default function EditProfileScreen() {
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const [fullName, setFullName] = useState(
    user?.user_metadata?.full_name || ""
  );
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName },
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
              Email cannot be changed directly.
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
