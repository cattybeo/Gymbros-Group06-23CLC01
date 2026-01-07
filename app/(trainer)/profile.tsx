import Button from "@/components/ui/Button";
import Colors from "@/constants/Colors";
import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrainerProfile() {
  const { profile } = useAuthContext();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/sign-in");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: colors.text,
            marginBottom: 20,
          }}
        >
          Hồ sơ Trainer
        </Text>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: colors.foreground_secondary }}>Họ tên:</Text>
          <Text style={{ fontSize: 18, color: colors.text }}>
            {profile?.full_name}
          </Text>
        </View>

        <Button title="Đăng xuất" onPress={handleSignOut} variant="secondary" />
      </View>
    </SafeAreaView>
  );
}
