import { GYM_IMAGES } from "@/constants/Images";
import { GymClass } from "@/lib/types";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ClassCardProps {
  gymClass: GymClass;
  onBook: (classId: string) => void;
  isBooking?: boolean;
}

export default function ClassCard({
  gymClass,
  onBook,
  isBooking,
}: ClassCardProps) {
  const startTime = new Date(gymClass.start_time);
  const endTime = new Date(gymClass.end_time);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (date: Date) =>
    date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "numeric",
    });

  const imageSource = GYM_IMAGES[gymClass.image_slug] || GYM_IMAGES["default"];

  return (
    <View className="bg-white p-4 rounded-2xl shadow-sm mb-4 border border-gray-100 overflow-hidden">
      <View className="flex-row mb-4">
        <Image
          source={imageSource}
          className="w-24 h-24 rounded-xl mr-4"
          resizeMode="cover"
        />
        <View className="flex-1 justify-between">
          <View>
            <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
              {gymClass.name}
            </Text>
            <Text className="text-blue-600 font-medium text-xs mt-1">
              {formatDate(startTime)}
            </Text>
            <Text className="text-gray-500 text-xs">
              {formatTime(startTime)} - {formatTime(endTime)}
            </Text>
          </View>

          <View className="self-start bg-gray-100 px-2 py-1 rounded-md mt-1">
            <Text className="text-xs font-semibold text-gray-600">
              {gymClass.capacity} slot
            </Text>
          </View>
        </View>
      </View>

      {gymClass.description && (
        <Text className="text-gray-500 mb-4 text-sm" numberOfLines={2}>
          {gymClass.description}
        </Text>
      )}

      <TouchableOpacity
        className={`w-full py-3 rounded-xl items-center ${
          isBooking ? "bg-gray-300" : "bg-blue-600 active:bg-blue-700"
        }`}
        onPress={() => onBook(gymClass.id)}
        disabled={isBooking}
      >
        <Text className="text-white font-bold">
          {isBooking ? "Đang đặt..." : "Đặt Lịch Ngay"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
