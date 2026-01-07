import Colors from "@/constants/Colors";
import { GYM_IMAGES } from "@/constants/Images";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import { GymClass } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ClassDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];
  const { showAlert, CustomAlertComponent } = useCustomAlert();

  const [gymClass, setGymClass] = useState<GymClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBooked, setIsBooked] = useState(false);
  const [bookedCount, setBookedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [classRes, countRes, bookingRes] = await Promise.all([
        supabase
          .from("classes")
          .select(
            "*, trainer:trainer_id(id, full_name, avatar_url, bio), location:locations(*)"
          )
          .eq("id", id)
          .maybeSingle(),
        supabase.rpc("get_class_counts", { class_ids: [id] }),
        user
          ? supabase
              .from("bookings")
              .select("id")
              .eq("class_id", id)
              .eq("user_id", user.id)
              .eq("status", "confirmed")
              .limit(1)
          : Promise.resolve({ data: null }),
      ]);

      if (classRes.error) throw classRes.error;
      setGymClass(classRes.data);

      if (countRes.data && countRes.data.length > 0) {
        setBookedCount(countRes.data[0].count);
      }

      setIsBooked(!!bookingRes.data && bookingRes.data.length > 0);
    } catch (error) {
      console.error("Error fetching class details:", error);
      showAlert(t("common.error"), t("classes.fetch_error"), "error");
    } finally {
      setLoading(false);
    }
  }, [id, t, showAlert]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleBooking = async () => {
    if (!id || !gymClass) return;
    setIsProcessing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        showAlert(t("common.error"), t("classes.login_required"), "error");
        return;
      }

      if (isBooked) {
        // Cancel logic
        const { error } = await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("class_id", id)
          .eq("user_id", user.id);

        if (error) throw error;
        setIsBooked(false);
        setBookedCount((prev) => prev - 1);
        showAlert(
          t("common.success"),
          t("classes.cancel_success_msg"),
          "success"
        );
      } else {
        // Book logic
        if (bookedCount >= gymClass.capacity) {
          showAlert(t("common.error"), t("classes.class_full"), "error");
          return;
        }

        const { error } = await supabase.from("bookings").insert({
          class_id: id,
          user_id: user.id,
          status: "confirmed",
        });

        if (error) throw error;
        setIsBooked(true);
        setBookedCount((prev) => prev + 1);
        showAlert(
          t("common.success"),
          t("classes.booking_success_msg"),
          "success"
        );
      }
    } catch (error) {
      console.error("Booking error:", error);
      showAlert(t("common.error"), t("classes.booking_error"), "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || !gymClass) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const startTime = new Date(gymClass.start_time);
  const endTime = new Date(gymClass.end_time);
  const duration =
    Math.abs(endTime.getTime() - startTime.getTime()) / (1000 * 60);

  const imageSource = GYM_IMAGES[gymClass.image_slug] || GYM_IMAGES["default"];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <CustomAlertComponent />
      <ScrollView className="flex-1">
        {/* Hero Section */}
        <View className="relative">
          <Image
            source={imageSource}
            className="w-full h-80"
            resizeMode="cover"
          />
          <View className="absolute top-12 left-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-black/40 rounded-full items-center justify-center border border-white/20"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="p-6 -mt-8 bg-background rounded-t-[40px]">
          {/* Header */}
          <Text className="text-3xl font-black text-foreground mb-4">
            {gymClass.name}
          </Text>

          {/* Stats Bar */}
          <View className="flex-row items-center border-b border-border pb-6 mb-6">
            <View className="flex-1 items-center border-r border-border">
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text className="text-foreground-secondary text-xs mt-1">
                {t("classes.duration")}
              </Text>
              <Text className="text-foreground font-bold">
                {duration} {t("classes.minutes")}
              </Text>
            </View>
            <View className="flex-1 items-center border-r border-border">
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text className="text-foreground-secondary text-xs mt-1">
                {t("classes.slots")}
              </Text>
              <Text className="text-foreground font-bold">
                {bookedCount}/{gymClass.capacity}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.primary}
              />
              <Text className="text-foreground-secondary text-xs mt-1">
                {t("classes.trainer")}
              </Text>
              <Text className="text-foreground font-bold" numberOfLines={1}>
                {gymClass.trainer?.full_name || t("classes.unknown_trainer")}
              </Text>
            </View>
          </View>

          {/* Time & Location Section */}
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center mr-4">
                <Ionicons name="calendar" size={20} color={colors.primary} />
              </View>
              <View>
                <Text className="text-foreground font-bold">
                  {startTime.toLocaleDateString(
                    i18n.language === "vi" ? "vi-VN" : "en-US",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }
                  )}
                </Text>
                <Text className="text-foreground-secondary text-sm">
                  {startTime.toLocaleTimeString(
                    i18n.language === "vi" ? "vi-VN" : "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}{" "}
                  -{" "}
                  {endTime.toLocaleTimeString(
                    i18n.language === "vi" ? "vi-VN" : "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center mr-4">
                <Ionicons
                  name="location-sharp"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View>
                <Text className="text-foreground font-bold">
                  {gymClass.location?.name || t("classes.default_location")}
                </Text>
                <Text className="text-foreground-secondary text-sm">
                  {gymClass.location?.address || t("classes.default_studio")}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View className="mb-8">
            <Text className="text-foreground text-xl font-bold mb-3">
              {t("classes.about_title")}
            </Text>
            <Text className="text-foreground-secondary leading-6">
              {gymClass.description || t("classes.no_description")}
            </Text>
          </View>

          {/* Trainer Profile Section */}
          {gymClass.trainer && (
            <View className="mb-20 bg-surface p-6 rounded-3xl border border-border">
              <View className="flex-row items-center mb-4">
                <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center overflow-hidden border border-border">
                  {gymClass.trainer.avatar_url ? (
                    <Image
                      source={{ uri: gymClass.trainer.avatar_url }}
                      className="w-full h-full"
                    />
                  ) : (
                    <Ionicons name="person" size={30} color={colors.primary} />
                  )}
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-foreground font-black text-lg">
                    {gymClass.trainer.full_name}
                  </Text>
                  <Text className="text-primary font-bold text-sm">
                    {t("classes.trainer")}
                  </Text>
                </View>
              </View>
              {gymClass.trainer.bio && (
                <Text className="text-foreground-secondary leading-6 italic">
                  "{gymClass.trainer.bio}"
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer Action Button */}
      <View className="p-6 border-t border-border bg-background">
        <TouchableOpacity
          onPress={handleBooking}
          disabled={isProcessing}
          className={`w-full py-4 rounded-2xl items-center shadow-lg ${
            isBooked
              ? "bg-error/10 border border-error"
              : "bg-primary shadow-primary/30"
          }`}
        >
          {isProcessing ? (
            <ActivityIndicator
              color={isBooked ? colors.error : colors.on_primary}
            />
          ) : (
            <Text
              className={`text-lg font-black ${isBooked ? "text-error" : "text-on_primary"}`}
            >
              {isBooked ? t("classes.cancel_booking") : t("classes.book_now")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
