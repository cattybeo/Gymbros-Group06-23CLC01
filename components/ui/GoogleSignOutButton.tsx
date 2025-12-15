import { signOutFromGoogle } from "@/lib/GoogleAuth";
import { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

export default function GoogleSignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await signOutFromGoogle();
      // AuthContext sẽ tự động nhận diện session = null và điều hướng về sign-in
    } catch (error) {
      console.log("Lỗi đăng xuất:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity
      onPress={handleSignOut}
      disabled={loading}
      className="bg-red-500 p-4 rounded-xl items-center justify-center"
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-white font-bold">Đăng xuất</Text>
      )}
    </TouchableOpacity>
  );
}
