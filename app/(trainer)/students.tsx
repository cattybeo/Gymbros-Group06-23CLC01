import Colors from "@/constants/Colors";
import { useThemeContext } from "@/lib/theme";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrainerStudents() {
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.text }}>Danh sách học viên (Roster)</Text>
      </View>
    </SafeAreaView>
  );
}
