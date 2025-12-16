import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PersonalSpecsScreen() {
  const router = useRouter();
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other">("Male");
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    if (!height || !weight || !age) {
      Alert.alert("Missing Info", "Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "User not found. Please login again.");
        return;
      }

      const { error } = await supabase.from("body_indices").insert({
        user_id: user.id,
        height: parseFloat(height),
        weight: parseFloat(weight),
        age: parseInt(age),
        gender,
        goal: "Maintain", // Default goal for now
        record_day: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      // Navigate to Home
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background px-6">
      <View className="mb-8 mt-4">
        <Text className="text-3xl font-bold text-white mb-2">
          Tell us about yourself
        </Text>
        <Text className="text-gray-400">
          This helps us tailor the experience to your body type.
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Gender Selection */}
        <Text className="text-gray-400 mb-2 font-bold">Gender</Text>
        <View className="flex-row justify-between gap-2 mb-6">
          {(["Male", "Female", "Other"] as const).map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGender(g)}
              className={`flex-1 items-center py-4 rounded-xl border ${
                gender === g
                  ? "bg-primary border-primary"
                  : "bg-surface border-gray-700"
              } mx-1 first:ml-0 last:mr-0`}
            >
              <Text
                className={`font-bold ${
                  gender === g ? "text-white" : "text-gray-400"
                }`}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <InputField
          label="Age"
          placeholder="e.g. 25"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />

        <InputField
          label="Weight (kg)"
          placeholder="e.g. 70"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />

        <InputField
          label="Height (cm)"
          placeholder="e.g. 175"
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
        />
      </ScrollView>

      <View className="mb-8 mt-4">
        <Button title="Next" onPress={handleNext} isLoading={loading} />
      </View>
    </SafeAreaView>
  );
}
