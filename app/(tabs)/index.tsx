import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-100">
      <Text className="text-2xl font-bold text-blue-600">
        Welcome to Gymbros!
      </Text>
      <Text className="mt-4 text-gray-500">Team Group 06 - FITUS</Text>
    </View>
  );
}
