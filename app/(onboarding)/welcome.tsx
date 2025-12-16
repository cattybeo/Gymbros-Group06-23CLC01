import Button from "@/components/ui/Button";
import { useRouter } from "expo-router";
import { ImageBackground, Text, View } from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop",
      }}
      className="flex-1 justify-end"
      resizeMode="cover"
    >
      <View className="bg-black/80 px-6 py-10 rounded-t-3xl items-center">
        <Text className="text-primary text-lg font-bold uppercase tracking-widest mb-2">
          Welcome to Gymbros
        </Text>
        <Text className="text-white text-3xl font-bold text-center mb-4">
          Training For Everyone
        </Text>
        <Text className="text-gray-400 text-center mb-8 px-4">
          Helping you to keep fit and healthy. Monitor your progress and achieve
          your goals.
        </Text>

        <View className="w-full">
          <Button
            title="Get Started"
            onPress={() => router.push("/personal-specs")}
          />
        </View>
      </View>
    </ImageBackground>
  );
}
