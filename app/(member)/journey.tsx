import Colors from "@/constants/Colors";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import { Booking, GymClass } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ClassCard from "@/components/ClassCard";
import { ClassCardSkeleton } from "@/components/ui/ClassCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

type BookingWithClass = Booking & { classes: GymClass };

const JourneySkeleton = () => {
  return (
    <View className="flex-1 bg-background px-4 pt-8">
      {/* Title Skeleton */}
      <View className="mb-6">
        <View style={{ marginBottom: 8 }}>
          <Skeleton width={150} height={36} borderRadius={8} />
        </View>
        <Skeleton width={220} height={20} borderRadius={4} />
      </View>

      {/* Stats Logic Skeleton - Box */}
      <View className="bg-card rounded-2xl p-4 mb-6 border border-border h-24 flex-row justify-around items-center">
        <View className="items-center gap-2">
          <Skeleton width={30} height={30} borderRadius={4} />
          <Skeleton width={80} height={12} borderRadius={4} />
        </View>
        <View className="w-[1px] bg-border h-8" />
        <View className="items-center gap-2">
          <Skeleton width={30} height={30} borderRadius={4} />
          <Skeleton width={80} height={12} borderRadius={4} />
        </View>
      </View>

      {/* Tabs Skeleton */}
      <View className="flex-row bg-muted rounded-xl p-1 mb-6 h-12">
        <View className="flex-1 m-1 bg-card rounded-lg" />
      </View>

      {/* Cards */}
      <View>
        <ClassCardSkeleton />
        <ClassCardSkeleton />
        <ClassCardSkeleton />
      </View>
    </View>
  );
};

export default function JourneyScreen() {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { showAlert, CustomAlertComponent } = useCustomAlert();

  const [bookings, setBookings] = useState<BookingWithClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">(
    "upcoming"
  );
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, classes(*)")
        .eq("user_id", user.id)
        .order("booking_date", { ascending: false });

      if (error) throw error;
      setBookings((data as BookingWithClass[]) || []);
    } catch {
      // Rule 11: Silence in failure (unless critical)
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const handleCancel = useCallback(
    async (classId: string) => {
      if (!user) return;

      showAlert(
        t("common.confirm"),
        t("classes.cancel_confirm_msg"),
        "warning",
        {
          primaryButtonText: t("common.no"),
          secondaryButtonText: t("common.yes"),
          onSecondaryPress: async () => {
            setCancellingId(classId);
            try {
              const { error } = await supabase
                .from("bookings")
                .delete()
                .eq("user_id", user.id)
                .eq("class_id", classId);

              if (error) throw error;

              showAlert(
                t("common.success"),
                t("classes.cancel_success_msg"),
                "success"
              );
              fetchBookings();
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : "Unknown error";
              showAlert(t("common.error"), errorMessage, "error");
            } finally {
              setCancellingId(null);
            }
          },
        }
      );
    },
    [user, t, showAlert, fetchBookings]
  );

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, [fetchBookings]);

  const now = new Date();
  const upcomingBookings = bookings.filter(
    (b) => new Date(b.classes.start_time) > now
  );
  const historyBookings = bookings.filter(
    (b) => new Date(b.classes.start_time) <= now
  );

  const displayData =
    activeTab === "upcoming" ? upcomingBookings : historyBookings;

  const renderHeader = () => (
    <View className="px-4 pt-8">
      <View className="mb-6">
        <Text className="text-3xl font-bold text-foreground">
          {t("navigation.journey")}
        </Text>
        <Text className="text-muted_foreground mt-1">
          {t("journey.subtitle")}
        </Text>
      </View>

      <View className="bg-card rounded-2xl p-4 mb-6 border border-border flex-row justify-around">
        <View className="items-center">
          <Text className="text-2xl font-bold text-primary">
            {bookings.length}
          </Text>
          <Text className="text-xs text-muted_foreground">
            {t("journey.total_bookings")}
          </Text>
        </View>
        <View className="w-[1px] bg-border h-8 self-center" />
        <View className="items-center">
          <Text className="text-2xl font-bold text-success">
            {historyBookings.length}
          </Text>
          <Text className="text-xs text-muted_foreground">
            {t("journey.completed")}
          </Text>
        </View>
      </View>

      <View className="flex-row bg-muted rounded-xl p-1 mb-6">
        <TouchableOpacity
          onPress={() => setActiveTab("upcoming")}
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === "upcoming" ? "bg-card shadow-sm" : ""}`}
        >
          <Text
            className={`font-bold ${activeTab === "upcoming" ? "text-foreground" : "text-muted_foreground"}`}
          >
            {t("journey.tab_upcoming")} ({upcomingBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("history")}
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === "history" ? "bg-card shadow-sm" : ""}`}
        >
          <Text
            className={`font-bold ${activeTab === "history" ? "text-foreground" : "text-muted_foreground"}`}
          >
            {t("journey.tab_history")} ({historyBookings.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        <JourneySkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          }
          renderItem={({ item }) => (
            <View className="px-4">
              <ClassCard
                gymClass={item.classes}
                onBook={() => {}}
                onCancel={handleCancel}
                isBooking={cancellingId === item.classes.id}
                isBooked={true}
              />
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-10">
              <View className="bg-muted w-20 h-20 rounded-full items-center justify-center mb-6">
                <Ionicons
                  name="calendar-outline"
                  size={40}
                  color={colors.text_secondary}
                />
              </View>
              <Text className="text-xl font-bold text-foreground text-center">
                {activeTab === "upcoming"
                  ? t("journey.no_upcoming_title")
                  : t("journey.no_history_title")}
              </Text>
              <Text className="text-muted_foreground text-center mt-2 px-4">
                {activeTab === "upcoming"
                  ? t("journey.no_upcoming_desc")
                  : t("journey.no_history_desc")}
              </Text>
              {activeTab === "upcoming" && (
                <TouchableOpacity
                  onPress={() => router.push("/(member)/classes")}
                  className="mt-8 bg-primary px-10 py-4 rounded-full shadow-lg shadow-primary/30"
                >
                  <Text
                    className="text-on_primary font-bold text-lg"
                    numberOfLines={1}
                  >
                    {t("journey.find_classes")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
      <CustomAlertComponent />
    </SafeAreaView>
  );
}
