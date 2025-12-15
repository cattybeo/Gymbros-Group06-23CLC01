import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const { user } = useAuthContext();

  const STATS = [
    { label: "Workouts", value: "12", unit: "Session" },
    { label: "Calories", value: "3.5k", unit: "Kcal" },
    { label: "Time", value: "420", unit: "Min" },
  ];

  const MENU_ITEMS = [
    { label: "Edit Profile", icon: "user" },
    { label: "Notifications", icon: "bell" },
    { label: "Privacy Policy", icon: "shield" },
    { label: "Settings", icon: "cog" },
  ];

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <View className="items-center pt-12 pb-8 bg-surface rounded-b-[30px] shadow-sm mb-6 border-b border-gray-800">
        <View className="w-24 h-24 bg-gray-700 rounded-full items-center justify-center mb-4 border-2 border-primary">
          <Text className="text-4xl">😎</Text>
        </View>
        <Text className="text-white text-2xl font-bold mb-1">
          {user?.email?.split("@")[0] || "Gymbro User"}
        </Text>
        <Text className="text-gray-500 text-sm">{user?.email}</Text>
        <Text className="text-primary font-bold text-xs mt-2 bg-orange-900/30 px-3 py-1 rounded-full uppercase tracking-wider">
          Diamond Member
        </Text>
      </View>

      {/* Stats */}
      <View className="px-6 mb-8 flex-row justify-between">
        {STATS.map((stat, index) => (
          <View
            key={index}
            className="bg-surface w-[30%] p-3 rounded-2xl items-center border border-gray-800"
          >
            <Text className="text-primary text-xl font-bold">{stat.value}</Text>
            <Text className="text-gray-400 text-xs mt-1">{stat.unit}</Text>
            <Text className="text-gray-500 text-[10px] mt-1 uppercase">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Menu Options */}
      <View className="px-6 mb-8">
        <Text className="text-white font-bold text-lg mb-4">General</Text>
        <View className="bg-surface rounded-2xl overflow-hidden border border-gray-800">
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              className={`flex-row items-center p-4 ${
                index !== MENU_ITEMS.length - 1
                  ? "border-b border-gray-800"
                  : ""
              }`}
            >
              <View className="w-8 h-8 bg-gray-900 rounded-full items-center justify-center mr-4">
                <FontAwesome
                  name={item.icon as any}
                  size={14}
                  color="#FFA500"
                />
              </View>
              <Text className="text-white flex-1 font-medium">
                {item.label}
              </Text>
              <FontAwesome name="angle-right" size={16} color="#4B5563" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logout Button */}
      <View className="px-6 pb-20">
        <TouchableOpacity
          className="w-full bg-surface border border-red-900/50 p-4 rounded-xl flex-row items-center justify-center"
          onPress={() => supabase.auth.signOut()}
        >
          <FontAwesome name="sign-out" size={18} color="#EF4444" />
          <Text className="text-red-500 font-bold ml-2">Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
