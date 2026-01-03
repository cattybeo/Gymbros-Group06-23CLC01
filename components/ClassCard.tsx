import { GYM_IMAGES } from "@/constants/Images";
import { GymClass } from "@/lib/types";
import { useTranslation } from "react-i18next";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ClassCardProps {
  gymClass: GymClass;
  onBook: (classId: string) => void;
  isBooking?: boolean;
  isBooked?: boolean;
  isFull?: boolean;
  spotsLeft?: number;
}

export default function ClassCard({
  gymClass,
  onBook,
  isBooking,
  isBooked,
  isFull,
  spotsLeft,
}: ClassCardProps) {
  const { t, i18n } = useTranslation();
  const startTime = new Date(gymClass.start_time);
  const endTime = new Date(gymClass.end_time);

  // use i18n.language. 'vi' maps to 'vi-VN', 'en' maps to 'en-US' basically.
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const formatDate = (date: Date) =>
    date.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "numeric",
    });

  const imageSource = GYM_IMAGES[gymClass.image_slug] || GYM_IMAGES["default"];

  // Determine Button State
  let buttonText = t("classes.book_now");
  let buttonStyle = "bg-primary active:bg-orange-600";
  let isDisabled = isBooking || isBooked || isFull;

  if (isBooking) {
    buttonText = t("classes.processing");
    buttonStyle = "bg-gray-700 opacity-50";
  } else if (isBooked) {
    buttonText = t("classes.booked");
    buttonStyle = "bg-green-600 opacity-90 border border-green-500";
  } else if (isFull) {
    buttonText = t("classes.full");
    buttonStyle = "bg-red-500 opacity-90";
  }

  return (
    <View className="bg-surface p-4 rounded-2xl shadow-sm mb-4 border border-gray-800 overflow-hidden">
      <View className="flex-row mb-4">
        <Image
          source={imageSource}
          className="w-24 h-24 rounded-xl mr-4"
          resizeMode="cover"
        />
        <View className="flex-1 justify-between">
          <View>
            <Text className="text-lg font-bold text-white" numberOfLines={1}>
              {gymClass.name}
            </Text>
            <Text className="text-primary font-medium text-xs mt-1">
              {formatDate(startTime)}
            </Text>
            <Text className="text-gray-400 text-xs">
              {formatTime(startTime)} - {formatTime(endTime)}
            </Text>
          </View>

          <View className="flex-row items-center mt-1 space-x-2">
            <View className="bg-gray-700 px-2 py-1 rounded-md">
              <Text className="text-xs font-semibold text-gray-300">
                {gymClass.capacity} {t("classes.slots")}
              </Text>
            </View>
            {spotsLeft !== undefined && (
              <Text
                className={`text-xs font-bold ${spotsLeft < 5 ? "text-red-400" : "text-green-400"}`}
              >
                {t("classes.spots_left", { count: spotsLeft })}
              </Text>
            )}
          </View>
        </View>
      </View>

      {gymClass.description && (
        <Text className="text-gray-400 mb-4 text-sm" numberOfLines={2}>
          {gymClass.description}
        </Text>
      )}

      <TouchableOpacity
        className={`w-full py-3 rounded-xl items-center ${buttonStyle}`}
        onPress={() => onBook(gymClass.id)}
        disabled={isDisabled}
      >
        <Text className="text-white font-bold">{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}
