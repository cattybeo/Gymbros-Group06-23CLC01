import ClassCard from "@/components/ClassCard";
import CrowdHeatmap, { TrafficData } from "@/components/CrowdHeatmap";
import { CatalogSkeleton } from "@/components/ui/CatalogSkeleton";
import { ClassCardSkeleton } from "@/components/ui/ClassCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import Colors from "@/constants/Colors";
import { GYM_IMAGES } from "@/constants/Images";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import { GymClass } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ClassesScreen() {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [contentOpacity] = useState(new Animated.Value(0));
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { t } = useTranslation();
  const { showAlert, CustomAlertComponent } = useCustomAlert();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];

  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [myBookings, setMyBookings] = useState<Set<string>>(new Set());
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});

  // Catalog State
  const [selectedType, setSelectedType] = useState<string>("All");

  useEffect(() => {
    fetchData();

    // 2026 Best Practice: Background polling for "Live" status (30s interval)
    // This keeps the heatmap and class capacity fresh without draining battery.
    const pollInterval = setInterval(() => {
      refreshLiveStatus();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [classes]);

  async function refreshLiveStatus() {
    try {
      const [trafficResponse, countsResponse] = await Promise.all([
        supabase.rpc("get_weekly_traffic"),
        supabase.rpc("get_class_counts", {
          class_ids: classes.map((c) => c.id),
        }),
      ]);

      if (!trafficResponse.error) setTrafficData(trafficResponse.data || []);
      if (!countsResponse.error && countsResponse.data) {
        const counts: Record<string, number> = {};
        countsResponse.data.forEach(
          (item: { class_id: string; count: number }) => {
            counts[item.class_id] = Number(item.count);
          }
        );
        setClassCounts(counts);
      }
    } catch (e) {
      console.warn("[LiveStatus] Silent refresh failed", e);
    }
  }

  // Premium Fade-in Transition
  useEffect(() => {
    if (dataReady) {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [dataReady, contentOpacity]);

  async function fetchData() {
    setLoading(true);
    setDataReady(false);
    contentOpacity.setValue(0);
    try {
      const [userResponse, trafficResponse, classesResponse] =
        await Promise.all([
          supabase.auth.getUser(),
          supabase.rpc("get_weekly_traffic"),
          supabase
            .from("classes")
            .select("*")
            .order("start_time", { ascending: true }),
        ]);

      const user = userResponse.data.user;

      if (!trafficResponse.error) {
        setTrafficData(trafficResponse.data || []);
      }

      if (classesResponse.error) throw classesResponse.error;
      const classesData = classesResponse.data || [];
      setClasses(classesData);

      const classIds = classesData.map((c) => c.id);

      if (classIds.length > 0) {
        if (user) {
          const { data: myBookingsData } = await supabase
            .from("bookings")
            .select("class_id")
            .eq("user_id", user.id)
            .in("class_id", classIds)
            .in("status", ["confirmed", "checked_in"]);

          setMyBookings(new Set(myBookingsData?.map((b) => b.class_id)));
        }

        const { data: countsData } = await supabase.rpc("get_class_counts", {
          class_ids: classIds,
        });

        const counts: Record<string, number> = {};
        if (countsData) {
          countsData.forEach((item: { class_id: string; count: number }) => {
            counts[item.class_id] = item.count;
          });
        }
        setClassCounts(counts);
      }
      setDataReady(true);
    } catch (error) {
      console.error(error);
      showAlert(t("common.error"), t("classes.fetch_error"), "error");
    } finally {
      setLoading(false);
    }
  }

  const handleBook = useCallback(
    async (classId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showAlert(
          t("auth.login_button"),
          t("classes.login_required"),
          "error",
          {
            onClose: () => router.push("/(auth)/sign-in"),
          }
        );
        return;
      }

      setBookingId(classId);

      try {
        const currentCount = classCounts[classId] || 0;
        const targetClass = classes.find((c) => c.id === classId);
        if (targetClass && currentCount >= targetClass.capacity) {
          showAlert(t("common.error"), t("classes.class_full"), "error");
          return;
        }

        const { data: memberships, error: memError } = await supabase
          .from("user_memberships")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .gte("end_date", new Date().toISOString())
          .limit(1);

        if (memError || !memberships || memberships.length === 0) {
          showAlert(
            t("classes.membership_required"),
            t("classes.membership_required_msg"),
            "error",
            {
              primaryButtonText: t("common.confirm"),
              onPrimaryPress: () => router.push("/membership"),
            }
          );
          setBookingId(null);
          return;
        }

        const { data: existingBooking } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .eq("class_id", classId)
          .single();

        if (existingBooking) {
          showAlert(t("common.error"), t("classes.already_booked"), "error");
          setBookingId(null);
          return;
        }

        const { error: bookError } = await supabase.from("bookings").insert({
          user_id: user.id,
          class_id: classId,
          booking_date: new Date().toISOString(),
          status: "confirmed",
          status_payment: "unpaid",
        });

        if (bookError) throw bookError;

        showAlert(
          t("classes.booking_success"),
          t("classes.booking_success_msg"),
          "success"
        );
        fetchData();
      } catch (error: any) {
        showAlert(t("classes.booking_error"), error.message, "error");
      } finally {
        setBookingId(null);
      }
    },
    [classes, classCounts, t, showAlert]
  );

  const uniqueClassTypes = useMemo(() => {
    const typesMap = new Map<string, { name: string; image_slug: string }>();
    classes.forEach((c) => {
      if (!typesMap.has(c.name)) {
        typesMap.set(c.name, { name: c.name, image_slug: c.image_slug });
      }
    });
    return Array.from(typesMap.values());
  }, [classes]);

  const filteredClasses = useMemo(() => {
    if (selectedType === "All") return classes;
    return classes.filter((c) => c.name === selectedType);
  }, [classes, selectedType]);

  const PageSkeleton = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="flex-1 mt-12"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="mb-4">
        <Skeleton width={200} height={36} borderRadius={4} />
        <View className="mt-2">
          <Skeleton width={150} height={16} borderRadius={4} />
        </View>
      </View>
      <CatalogSkeleton />
      <CrowdHeatmap data={[]} isLoading={true} />
      <View className="mb-4">
        <Skeleton width={180} height={24} borderRadius={4} />
      </View>
      <ClassCardSkeleton />
      <ClassCardSkeleton />
    </ScrollView>
  );

  const renderCatalog = () => (
    <View className="mb-6">
      <Text className="text-xl font-bold text-foreground mb-3 px-1">
        {t("classes.explore")}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => setSelectedType("All")}
            className={`mr-3 items-center ${
              selectedType === "All" ? "opacity-100" : "opacity-60"
            }`}
          >
            <View
              className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${
                selectedType === "All" ? "bg-primary" : "bg-card"
              }`}
            >
              <Ionicons
                name="grid-outline"
                size={24}
                color={
                  selectedType === "All"
                    ? colors.on_primary
                    : colors.muted_foreground
                }
              />
            </View>
            <Text
              className={`text-xs font-semibold ${
                selectedType === "All"
                  ? "text-primary"
                  : "text-muted_foreground"
              }`}
            >
              {t("classes.all")}
            </Text>
          </TouchableOpacity>

          {uniqueClassTypes.map((type) => {
            const isSelected = selectedType === type.name;
            const imageSource =
              GYM_IMAGES[type.image_slug] || GYM_IMAGES["default"];

            return (
              <TouchableOpacity
                key={type.name}
                onPress={() => setSelectedType(type.name)}
                className={`mr-3 items-center ${isSelected ? "opacity-100" : "opacity-60"}`}
              >
                <Image
                  source={imageSource}
                  className={`w-16 h-16 rounded-full mb-2 border-2 ${isSelected ? "border-primary" : "border-transparent"}`}
                  resizeMode="cover"
                />
                <Text
                  className={`text-xs font-semibold max-w-[80px] text-center ${
                    isSelected ? "text-primary" : "text-muted_foreground"
                  }`}
                  numberOfLines={1}
                >
                  {type.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  const renderItem = useCallback(
    ({ item }: { item: GymClass }) => {
      const bookedCount = classCounts[item.id] || 0;
      const isBooked = myBookings.has(item.id);
      const isFull = bookedCount >= item.capacity;
      const spotsLeft = item.capacity - bookedCount;

      return (
        <ClassCard
          gymClass={item}
          onBook={handleBook}
          isBooking={bookingId === item.id}
          isBooked={isBooked}
          isFull={isFull}
          spotsLeft={spotsLeft}
        />
      );
    },
    [classCounts, myBookings, bookingId, handleBook]
  );

  return (
    <View className="flex-1 bg-background pt-12 px-4">
      {!dataReady ? (
        <PageSkeleton />
      ) : (
        <Animated.View
          style={{ flex: 1, opacity: contentOpacity, marginTop: 48 }}
        >
          <FlatList
            data={filteredClasses}
            keyExtractor={(item) => item.id}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            ListHeaderComponent={
              <>
                <View className="mb-2">
                  <Text className="text-3xl font-bold text-foreground">
                    {t("classes.title")}
                  </Text>
                  <Text className="text-muted_foreground mt-1">
                    {t("classes.subtitle")}
                  </Text>
                </View>
                {renderCatalog()}
                <CrowdHeatmap data={trafficData} isLoading={loading} />
                <Text className="text-lg font-bold text-foreground mb-2 mt-2 px-1">
                  {t("classes.upcoming_schedule")}
                </Text>
              </>
            }
            renderItem={renderItem}
            refreshing={loading}
            onRefresh={fetchData}
            ListEmptyComponent={
              <Text className="text-center text-muted_foreground mt-10">
                {t("classes.empty_list")}
              </Text>
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </Animated.View>
      )}
      <CustomAlertComponent />
    </View>
  );
}
