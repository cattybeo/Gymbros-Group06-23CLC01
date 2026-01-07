import Colors from "@/constants/Colors";
import { GYM_IMAGES } from "@/constants/Images";
import { useThemeContext } from "@/lib/theme";
import { GymClass } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
  onCancel?: (classId: string) => void;
  isBooking?: boolean;
  isBooked?: boolean;
  isFull?: boolean;
  spotsLeft?: number;
  isAIRecommended?: boolean;
}

const ClassCard = memo(function ClassCard({
  gymClass,
  onBook,
  onCancel,
  isBooking,
  isBooked,
  isFull,
  spotsLeft,
  isAIRecommended,
}: ClassCardProps) {
  const { t, i18n } = useTranslation();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];
  const startTime = new Date(gymClass.start_time);
  const endTime = new Date(gymClass.end_time);

  // Milestone 3: Advanced UI Logic
  const now = new Date();
  const diffInMs = startTime.getTime() - now.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const isStartingSoon = diffInMinutes > 0 && diffInMinutes <= 60;

  const trainerName =
    gymClass.trainer?.full_name || t("classes.unknown_trainer");

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
  }, [isAIRecommended, borderPulse]);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: isAIRecommended ? "#EAB308" : "transparent",
    borderWidth: isAIRecommended ? 2 : 0,
    opacity: borderPulse.value,
    borderRadius: 18, // Slightly larger than rounded-2xl to wrap perfectly
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
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
  const isPast = now > startTime;
  const isOngoing = now >= startTime && now <= endTime;

  let buttonText = t("classes.book_now");
  let buttonStyle = "bg-primary active:bg-primary/90";
  let textStyle = "text-on_primary";
  let isDisabled = isBooking || isBooked || isFull || isPast;

  if (isBooking) {
    buttonText = t("classes.processing");
    buttonStyle = "bg-muted border border-border";
    textStyle = "text-muted_foreground";
  } else if (isBooked) {
    if (!isPast && !isOngoing && onCancel) {
      buttonText = t("classes.cancel_booking");
      buttonStyle = "bg-error/10 border border-error shadow-none";
      textStyle = "text-error";
      isDisabled = false;
    } else {
      buttonText = t("classes.booked");
      buttonStyle = "bg-success opacity-90 border border-success";
      isDisabled = true;
    }
  } else if (isFull) {
    buttonText = t("classes.full");
    buttonStyle = "bg-error opacity-90";
  } else if (isPast) {
    buttonText = isOngoing ? t("classes.ongoing") : t("classes.expired");
    buttonStyle = "bg-muted opacity-60";
  }

  const handlePress = () => {
    if (isBooked && onCancel && !isPast && !isOngoing) {
      onCancel(gymClass.id);
    } else {
      onBook(gymClass.id);
    }
  };

  const handleCardPress = () => {
    router.push({
      pathname: "/class/[id]",
      params: { id: gymClass.id },
    });
  };

  return (
    <View
      className={`bg-card p-4 rounded-2xl shadow-sm mb-4 border border-border ${isAIRecommended ? "shadow-lg" : ""}`}
    >
      {isAIRecommended && (
        <>
          <Animated.View style={animatedBorderStyle} pointerEvents="none" />
          <View className="absolute top-2 right-2 z-10 bg-accent px-2 py-0.5 rounded-full flex-row items-center">
            <Ionicons name="sparkles" size={10} color="white" />
            <Text className="text-[10px] font-bold text-white ml-1">
              {t("classes.ai_recommended")}
            </Text>
          </View>
        </>
      )}

      <TouchableOpacity activeOpacity={0.7} onPress={handleCardPress}>
        {isStartingSoon && !isPast && (
          <View className="absolute top-2 left-2 z-10 bg-error px-2 py-0.5 rounded-full flex-row items-center">
            <Ionicons name="time-outline" size={10} color="white" />
            <Text className="text-[10px] font-bold text-white ml-1 uppercase">
              {t("classes.starting_soon")}
            </Text>
          </View>
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
              <Text className="text-muted_foreground text-[10px] mb-1">
                {t("classes.lead_by")} {trainerName}
              </Text>
              <Text className="text-primary font-medium text-xs">
                {formatDate(startTime)}
              </Text>
              <Text className="text-muted_foreground text-xs">
                {formatTime(startTime)} - {formatTime(endTime)}
              </Text>
              {gymClass.location && (
                <View className="flex-row items-center mt-1">
                  <Ionicons
                    name="location-outline"
                    size={12}
                    color={colors.muted_foreground}
                  />
                  <Text
                    className="text-muted_foreground text-[10px] ml-1 flex-1"
                    numberOfLines={1}
                  >
                    {gymClass.location.name}
                  </Text>
                </View>
              )}
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
          <Text
            className="text-muted_foreground mb-4 text-sm"
            numberOfLines={2}
          >
            {gymClass.description}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className={`w-full py-3 rounded-xl items-center ${buttonStyle}`}
        onPress={handlePress}
        disabled={isDisabled}
      >
        <Text className={`font-bold ${textStyle}`}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
});

export default ClassCard;
