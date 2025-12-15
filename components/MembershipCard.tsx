import { GYM_IMAGES } from "@/constants/Images";
import { MembershipPlan } from "@/lib/types";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface MembershipCardProps {
  plan: MembershipPlan;
  onBuy: (planId: string) => void;
  isLoading?: boolean;
}

export default function MembershipCard({
  plan,
  onBuy,
  isLoading,
}: MembershipCardProps) {
  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(plan.price);

  const imageSource = GYM_IMAGES[plan.image_slug] || GYM_IMAGES["default"];

  return (
    <View className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-gray-100 overflow-hidden">
      <Image
        source={imageSource}
        className="w-full h-40 rounded-xl mb-4"
        resizeMode="cover"
      />
      <View className="flex-row justify-between items-center mb-2 px-2">
        <Text className="text-xl font-bold text-gray-900">{plan.name}</Text>
        <View className="bg-blue-50 px-3 py-1 rounded-full">
          <Text className="text-blue-600 font-semibold text-xs">
            {plan.duration_months} Tháng
          </Text>
        </View>
      </View>

      <Text className="text-3xl font-extrabold text-blue-600 my-2 px-2">
        {formattedPrice}
      </Text>

      {plan.description && (
        <Text className="text-gray-500 mb-6 px-2">{plan.description}</Text>
      )}

      <TouchableOpacity
        className={`w-full py-4 rounded-xl items-center ${
          isLoading ? "bg-gray-300" : "bg-blue-600 active:bg-blue-700"
        }`}
        onPress={() => onBuy(plan.id)}
        disabled={isLoading}
      >
        <Text className="text-white font-bold text-lg">
          {isLoading ? "Đang xử lý..." : "Đăng Ký Ngay"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
