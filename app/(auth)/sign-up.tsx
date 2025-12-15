import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setLoading(true);

    // 1. Gọi Supabase Sign Up
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Đăng ký thất bại", error.message);
    } else {
      // 2. Thông báo thành công
      Alert.alert(
        "Thành công",
        "Tài khoản đã được tạo! Vui lòng kiểm tra email để xác thực.",
        [{ text: "OK", onPress: () => router.back() }] // Quay lại trang login
      );
    }
  }

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <View className="items-center mb-8">
        <Text className="text-3xl font-bold text-white">Tạo tài khoản</Text>
        <Text className="text-gray-400 mt-2">Tham gia cộng đồng Gymbros</Text>
      </View>

      <View>
        <InputField
          label="Email"
          placeholder="email@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <InputField
          label="Mật khẩu"
          placeholder="••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View className="mt-4">
          <Button title="Đăng Ký" onPress={handleSignUp} isLoading={loading} />
        </View>
      </View>

      <View className="flex-row justify-center mt-8">
        <Text className="text-gray-400">Đã có tài khoản? </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary font-bold">Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
