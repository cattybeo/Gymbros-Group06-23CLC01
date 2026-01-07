import { GYM_IMAGES } from "@/constants/Images";
import { GymClass } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import React, { memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Image, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface ClassCardProps {
  gymClass: GymClass;
  onBook: (classId: string) => void;
  isBooking?: boolean;
  isBooked?: boolean;
  isFull?: boolean;
  spotsLeft?: number;
  isAIRecommended?: boolean;
}

const ClassCard = memo(function ClassCard({
  gymClass,
  onBook,
  isBooking,
  isBooked,
  isFull,
  spotsLeft,
  isAIRecommended,
}: ClassCardProps) {
  const { t, i18n } = useTranslation();
  const startTime = new Date(gymClass.start_time);
  const endTime = new Date(gymClass.end_time);

  // Pulse effect for AI Recommended border
  const borderPulse = useSharedValue(0.5);

  useEffect(() => {
    if (isAIRecommended) {
      borderPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0.5, { duration: 1500 })
        ),
        -1,
        true
      );
    } else {
      borderPulse.value = 0.5;
    }
  }, [isAIRecommended]);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: isAIRecommended ? "#EAB308" : "transparent", // accent color
    borderWidth: 2,
    opacity: borderPulse.value,
    borderRadius: 16,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }));

  // Map i18n language to locale format
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
  let buttonStyle = "bg-primary active:bg-primary/90";
  let isDisabled = isBooking || isBooked || isFull;

  if (isBooking) {
    buttonText = t("classes.processing");
    buttonStyle = "bg-surface_highlight opacity-50";
  } else if (isBooked) {
    buttonText = t("classes.booked");
    buttonStyle = "bg-success opacity-90 border border-success";
  } else if (isFull) {
    buttonText = t("classes.full");
    buttonStyle = "bg-error opacity-90";
  }

  return (
    <View
      className={`bg-card p-4 rounded-2xl shadow-sm mb-4 border ${isAIRecommended ? "border-accent shadow-lg" : "border-border"}`}
    >
      {isAIRecommended && (
        <>
          <Animated.View style={animatedBorderStyle} />
          <View className="absolute top-2 right-2 z-10 bg-accent px-2 py-0.5 rounded-full flex-row items-center">
            <Ionicons name="sparkles" size={10} color="white" />
            <Text className="text-[10px] font-bold text-white ml-1">
              {t("classes.ai_recommended")}
            </Text>
          </View>
        </>
      )}
      <View className="flex-row mb-4">
        <Image
          source={imageSource}
          className="w-24 h-24 rounded-xl mr-4"
          resizeMode="cover"
        />
        <View className="flex-1 justify-between">
          <View>
            <Text
              className="text-lg font-bold text-foreground"
              numberOfLines={1}
            >
              {gymClass.name}
            </Text>
            <Text className="text-primary font-medium text-xs mt-1">
              {formatDate(startTime)}
            </Text>
            <Text className="text-muted_foreground text-xs">
              {formatTime(startTime)} - {formatTime(endTime)}
            </Text>
          </View>

          <View className="flex-row items-center mt-1 space-x-2">
            <View className="bg-secondary px-2 py-1 rounded-md border border-border">
              <Text className="text-xs font-semibold text-on-secondary">
                {gymClass.capacity} {t("classes.slots")}
              </Text>
            </View>
            {spotsLeft !== undefined && (
              <Text
                className={`text-xs font-bold ${spotsLeft < 5 ? "text-error" : "text-success"}`}
              >
                {t("classes.spots_left", { count: spotsLeft })}
              </Text>
            )}
          </View>
        </View>
      </View>

      {gymClass.description && (
        <Text className="text-muted_foreground mb-4 text-sm" numberOfLines={2}>
          {gymClass.description}
        </Text>
      )}

      <TouchableOpacity
        className={`w-full py-3 rounded-xl items-center ${buttonStyle}`}
        onPress={() => onBook(gymClass.id)}
        disabled={isDisabled}
      >
        <Text className="text-on_primary font-bold">{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
});

export default ClassCard;
