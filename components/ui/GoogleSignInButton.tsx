import { signInWithGoogle } from "@/lib/GoogleAuth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

export default function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();

  async function handlePress() {
    setLoading(true);

    const result = await signInWithGoogle();

    setLoading(false);

    if (!result.success && !result.cancelled && result.error) {
      Alert.alert("Đăng nhập thất bại", result.error);
    }
    // Nếu success -> AuthContext tự động điều hướng
  }

  if (loading) {
    return (
      <TouchableOpacity
        disabled
        className="w-full bg-surface border border-gray-700 p-4 rounded-xl flex-row items-center justify-center shadow-sm mb-3"
      >
        <ActivityIndicator size="small" color="#FFA500" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="w-full bg-surface border border-gray-700 p-4 rounded-xl flex-row items-center justify-center shadow-sm mb-3"
      disabled={loading}
    >
      <Image
        source={require("@/assets/oauth-providers/google.png")}
        className="w-6 h-6 mr-3"
        resizeMode="contain"
      />
      <Text className="text-white font-bold text-base">Google</Text>
    </TouchableOpacity>
  );
}
