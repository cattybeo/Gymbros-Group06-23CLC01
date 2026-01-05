import ClassCard from "@/components/ClassCard";
import CrowdHeatmap, { TrafficData } from "@/components/CrowdHeatmap";
import { GYM_IMAGES } from "@/constants/Images";
import { supabase } from "@/lib/supabase";
import { GymClass } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
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
        const bookingsQuery = supabase
          .from("bookings")
          .select("class_id, user_id, status") // Select only needed columns
          .in("class_id", classIds)
          .in("status", ["confirmed", "checked_in"]);

        const requests = [bookingsQuery];

        // If user logged in, fetch their specific bookings too (or derived from above if permission allows, but RLS usually restricts. safe to query twice or optimize if RLS allows shared read)
        // With current RLS: "Users can view own bookings". So we can't fetch ALL bookings in one query unless we use a secured view or RPC.
        // Wait, current logic fetches "allBookings" for counts?
        // NOTE: RLS policy "Users can view own bookings" means `allBookings` query returns ONLY user's bookings unless I use a Service Role or RPC.
        // My previous audit missed this! the `classCounts` on client side is likely WRONG if RLS is on!
        // Fix: I already made `get_weekly_traffic` RPC. I should probably have made a `get_class_counts` RPC.
        // BUT, for now, let's Stick to the optimize.

        // Actually, if RLS is on, Step 4 in original code:
        // const { data: allBookings } = await supabase...
        // This likely returns ONLY the current user's bookings.

        // CRITICAL REFLECTION:
        // Verification: Check schema.sql RLS.
        // line 76: create policy "Users can view own bookings" ... using (auth.uid() = user_id);
        // THIS MEANS: Client CANNOT calculate global `classCounts` using simple select!
        // The Heatmap works because it's a SECURITY DEFINER RPC.
        // The Class List "Spots Left" is currently BROKEN (shows only my bookings).

        // IMMEDIATE ACTION: I need to fix this Logic Error first!
        // I should use the `trafficData` (which is aggregate) or create a new light RPC for counts.
        // Or, since `get_weekly_traffic` returns generic scores, maybe I can use that? No, that's approximate.
        // Best approach for NOW: Create a simple RPC `get_class_counts(class_ids)` or ignore (since user asked for audit).
        // I will optimize the valid structure first, but adding a TODO for RLS.

        // Actually, `classes` table has `capacity`. We need `count(bookings)`.
        // Let's optimize the CURRENT flow, acknowledging the RLS limitation (maybe I'll Notify User about this bug).

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
      Alert.alert(t("common.error"), t("classes.fetch_error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleBook(classId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert(t("auth.login_button"), t("classes.login_required"));
      return;
    }

    setBookingId(classId);

    try {
      // 0. Check Capacity
      const currentCount = classCounts[classId] || 0;
      const targetClass = classes.find((c) => c.id === classId);
      if (targetClass && currentCount >= targetClass.capacity) {
        Alert.alert(t("common.error"), t("classes.class_full"));
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
        Alert.alert(
          t("classes.membership_required"),
          t("classes.membership_required_msg")
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
        Alert.alert(t("common.error"), t("classes.already_booked"));
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

      Alert.alert(
        t("classes.booking_success"),
        t("classes.booking_success_msg")
      );
      fetchData();
    } catch (error: any) {
      Alert.alert(t("classes.booking_error"), error.message);
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
      <Text className="text-xl font-bold text-white mb-3 px-1">
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
                selectedType === "All" ? "bg-primary" : "bg-gray-700"
              }`}
            >
              <Ionicons
                name="grid-outline"
                size={24}
                color={selectedType === "All" ? "white" : "#9ca3af"}
              />
            </View>
            <Text
              className={`text-xs font-semibold ${
                selectedType === "All" ? "text-primary" : "text-gray-400"
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
                    isSelected ? "text-primary" : "text-gray-400"
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
        <Text className="text-3xl font-bold text-white">
          {t("classes.title")}
        </Text>
        <Text className="text-gray-400 mt-1">{t("classes.subtitle")}</Text>
      </View>

      <FlatList
        data={filteredClasses}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {renderCatalog()}
            <CrowdHeatmap data={trafficData} isLoading={loading} />
            <Text className="text-lg font-bold text-white mb-2 mt-2 px-1">
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
            <Text className="text-center text-gray-500 mt-10">
              {t("classes.empty_list")}
            </Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
