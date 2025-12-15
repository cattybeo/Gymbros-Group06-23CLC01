import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button, Text, View } from "react-native";

export default function ProfileScreen() {
  const { user } = useAuthContext(); // Lấy user từ Context

  return (
    <View className="flex-1 justify-center items-center">
      <Text>Xin chào: {user?.email}</Text>
      <Text>ID của bạn: {user?.id}</Text>

      <Button
        title="Đăng xuất"
        onPress={() => supabase.auth.signOut()}
        // Khi hàm này chạy -> session null -> _layout tự động chuyển về Login
      />
    </View>
  );
}
