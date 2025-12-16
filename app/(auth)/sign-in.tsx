import Button from "@/components/ui/Button";
import GoogleSignInButton from "@/components/ui/GoogleSignInButton";
import InputField from "@/components/ui/InputField";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <SafeAreaView className="flex-1 bg-background px-6 justify-center">
      {/* Header / Logo */}
      <Animated.View
        className="items-center mb-8"
        entering={FadeInDown.delay(200).springify()}
      >
        <View className="w-20 h-20 bg-surface rounded-full items-center justify-center mb-4 border border-primary">
          <Text className="text-4xl">💪</Text>
        </View>
        <Text className="text-3xl font-bold text-white">Welcome Back!</Text>
        <Text className="text-gray-400 mt-2">
          Đăng nhập để tiếp tục tập luyện
        </Text>
      </Animated.View>

      {/* Form */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(1000).springify()}
      >
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
      </Animated.View>

      {/* Footer Nav & OAuth */}
      <Animated.View
        entering={FadeInUp.delay(600).duration(1000).springify()}
        className="mt-8"
      >
        <View className="flex-row justify-center mb-8">
          <Text className="text-gray-400">Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push("/sign-up")}>
            <Text className="text-primary font-bold">Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-[1px] bg-gray-700" />
          <Text className="mx-4 text-gray-500">Hoặc tiếp tục với</Text>
          <View className="flex-1 h-[1px] bg-gray-700" />
        </View>

        <GoogleSignInButton />
      </Animated.View>
    </SafeAreaView>
  );
}
