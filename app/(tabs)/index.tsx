import { GYM_IMAGES } from "@/constants/Images";
import { useAuthContext } from "@/lib/AuthContext";
import { FontAwesome } from "@expo/vector-icons";
import React from "react";
import { Image, ScrollView, Text, View } from "react-native";
import Barcode from "react-native-barcode-svg";

export default function HomeScreen() {
  const { user } = useAuthContext();

  const MENU_ITEMS = [
    { name: "Workout", icon: "bicycle" },
    { name: "Diet", icon: "leaf" },
    { name: "Shop", icon: "shopping-cart" },
    { name: "Blog", icon: "newspaper-o" },
  ];

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-12 px-6 mb-6">
        <Text className="text-gray-400 text-sm">Welcome back,</Text>
        <Text className="text-white text-2xl font-bold">
          {user?.email?.split("@")[0] || "Gymbro"}
        </Text>
      </View>

      {/* Digital Membership Card */}
      <View className="px-6 mb-8">
        <View className="bg-surface rounded-2xl p-6 border border-gray-800 shadow-sm relative overflow-hidden">
          {/* Card Bg Decoration */}
          <View className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-10 rounded-bl-full translate-x-10 -translate-y-10" />

          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-primary font-bold text-lg tracking-widest">
                GYMBROS
              </Text>
              <Text className="text-gray-500 text-xs tracking-wider">
                PREMIUM MEMBER
              </Text>
            </View>
            <FontAwesome name="diamond" size={24} color="#FFA500" />
          </View>

          <View className="flex-row justify-between items-end">
            <View>
              <Text className="text-gray-400 text-xs mb-1">MEMBER NAME</Text>
              <Text className="text-white font-bold text-lg uppercase">
                {user?.email?.split("@")[0] || "MEMBER"}
              </Text>
            </View>
            {/* Barcode */}
            <View className="bg-white p-2 rounded-md items-center justify-center">
              <Barcode
                value={user?.id || "12345678"}
                format="CODE128"
                maxWidth={100}
                height={30}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Promotional Banner */}
      <View className="px-6 mb-8">
        <View className="rounded-2xl overflow-hidden h-40 relative">
          <Image
            source={GYM_IMAGES.body_pump}
            className="w-full h-full absolute"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/40 flex-1 justify-center px-6">
            <Text className="text-white font-bold text-xl w-2/3">
              TRANSFORM YOUR BODY WITH POWER PUMP
            </Text>
            <Text className="text-primary font-bold mt-2">JOIN NOW &rarr;</Text>
          </View>
        </View>
      </View>

      {/* Grid Menu */}
      <View className="px-6 mb-8">
        <Text className="text-white font-bold text-lg mb-4">Quick Access</Text>
        <View className="flex-row flex-wrap justify-between">
          {MENU_ITEMS.map((item, index) => (
            <View
              key={index}
              className="w-[48%] bg-surface p-4 rounded-xl mb-4 items-center border border-gray-800"
            >
              <View className="w-12 h-12 bg-gray-800 rounded-full items-center justify-center mb-2">
                <FontAwesome
                  name={item.icon as any}
                  size={20}
                  color="#FFA500"
                />
              </View>
              <Text className="text-gray-300 font-medium">{item.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View className="px-6 pb-20">
        <Text className="text-white font-bold text-lg mb-4">
          Recent Activity
        </Text>
        <View className="bg-surface rounded-xl p-4 border border-gray-800 flex-row items-center">
          <View className="w-10 h-10 bg-green-900/50 rounded-full items-center justify-center mr-4">
            <FontAwesome name="check" size={16} color="#4ADE80" />
          </View>
          <View>
            <Text className="text-white font-medium">Check-in Success</Text>
            <Text className="text-gray-500 text-xs">Today, 09:30 AM</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
