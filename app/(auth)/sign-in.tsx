import Button from "@/components/ui/Button";
import GoogleSignInButton from "@/components/ui/GoogleSignInButton";
import InputField from "@/components/ui/InputField";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert("Đăng nhập thất bại", error.message);
    }
  }

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      {/* Header / Logo */}
      <View className="items-center mb-8">
        <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
          <Text className="text-4xl">💪</Text>
        </View>
        <Text className="text-3xl font-bold text-gray-900">Welcome Back!</Text>
        <Text className="text-gray-500 mt-2">
          Đăng nhập để tiếp tục tập luyện
        </Text>
      </View>

      {/* Form */}
      <View>
        <InputField
          label="Email"
          placeholder="Nhập email của bạn"
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
          <Button
            title="Đăng Nhập"
            onPress={handleSignIn}
            isLoading={loading}
          />
        </View>
      </View>

      {/* Footer Nav */}
      <View className="flex-row justify-center mt-8">
        <Text className="text-gray-500">Chưa có tài khoản? </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
          <Text className="text-blue-600 font-bold">Đăng ký ngay</Text>
        </TouchableOpacity>
      </View>

      {/* OAuth Buttons */}
      <View className="mt-8">
        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-[2px] bg-gray-200" />
          <Text className="mx-4 text-gray-400">Hoặc tiếp tục với</Text>
          <View className="flex-1 h-[2px] bg-gray-200" />
        </View>

        <GoogleSignInButton />
      </View>
    </View>
  );
}
