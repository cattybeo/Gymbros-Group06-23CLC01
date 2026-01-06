import ClassCard from "@/components/ClassCard";
import CrowdHeatmap, { TrafficData } from "@/components/CrowdHeatmap";
import Colors from "@/constants/Colors";
import { GYM_IMAGES } from "@/constants/Images";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import { GymClass } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ClassesScreen() {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(false);
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
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Parallel Fetching: User, Traffic, Classes
      const [userResponse, trafficResponse, classesResponse] =
        await Promise.all([
          supabase.auth.getUser(),
          supabase.rpc("get_weekly_traffic"),
          supabase
            .from("classes")
            .select("*")
            // .gte("start_time", new Date().toISOString()) // Uncomment for Prod
            .order("start_time", { ascending: true }),
        ]);

      const user = userResponse.data.user;

      // 1. Set Traffic
      if (!trafficResponse.error) {
        setTrafficData(trafficResponse.data || []);
      }

      // 2. Set Classes
      if (classesResponse.error) throw classesResponse.error;
      const classesData = classesResponse.data || [];
      setClasses(classesData);

      const classIds = classesData.map((c) => c.id);

      // 3. Parallel Fetching: Bookings (Dependent on Class IDs)
      if (classIds.length > 0) {
        // FIXME: RLS prevents fetching global counts client-side. Using RPC bypass for now.

        if (user) {
          // Fetch My Bookings
          const { data: myBookingsData } = await supabase
            .from("bookings")
            .select("class_id")
            .eq("user_id", user.id)
            .in("class_id", classIds)
            .in("status", ["confirmed", "checked_in"]);

          setMyBookings(new Set(myBookingsData?.map((b) => b.class_id)));
        }

        // Fetch Global Counts via RPC (Bypass RLS)
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
    } catch (error) {
      console.error(error);
      showAlert(t("common.error"), t("classes.fetch_error"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleBook(classId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      showAlert(t("auth.login_button"), t("classes.login_required"), "error", {
        onClose: () => router.push("/(auth)/sign-in"),
      });
      return;
    }

    setBookingId(classId);

    try {
      // 0. Check Capacity
      const currentCount = classCounts[classId] || 0;
      const targetClass = classes.find((c) => c.id === classId);
      if (targetClass && currentCount >= targetClass.capacity) {
        showAlert(t("common.error"), t("classes.class_full"), "error");
        return;
      }

      // 1. Check Active Membership
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
            onPrimaryPress: () => router.push("/membership"), // Guide them to membership page
          }
        );
        setBookingId(null);
        return;
      }

      // 2. Check duplicate
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

      // 3. Create Booking
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
  }

  // --- Derived State for Catalog ---
  const uniqueClassTypes = useMemo(() => {
    const typesMap = new Map<string, { name: string; image_slug: string }>();
    classes.forEach((c) => {
      // Use name as key to ensure uniqueness
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

  const renderCatalog = () => (
    <View className="mb-6">
      <Text className="text-xl font-bold text-foreground mb-3 px-1">
        {t("classes.explore")}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row">
          {/* 'All' Option */}
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
                    ? colors.primary
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

          {/* Dynamic Types */}
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

  return (
    <View className="flex-1 bg-background pt-12 px-4">
      <View className="mb-2">
        <Text className="text-3xl font-bold text-foreground">
          {t("classes.title")}
        </Text>
        <Text className="text-muted_foreground mt-1">
          {t("classes.subtitle")}
        </Text>
      </View>

      <FlatList
        data={filteredClasses}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {renderCatalog()}
            <CrowdHeatmap data={trafficData} isLoading={loading} />
            <Text className="text-lg font-bold text-foreground mb-2 mt-2 px-1">
              {t("classes.upcoming_schedule")}
            </Text>
          </>
        }
        renderItem={({ item }) => {
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
        }}
        refreshing={loading}
        onRefresh={fetchData}
        ListEmptyComponent={
          !loading ? (
            <Text className="text-center text-muted_foreground mt-10">
              {t("classes.empty_list")}
            </Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <CustomAlertComponent />
    </View>
  );
}
