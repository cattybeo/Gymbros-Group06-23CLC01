import ClassCard from "@/components/ClassCard";
import { supabase } from "@/lib/supabase";
import { GymClass } from "@/lib/types";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, Text, View } from "react-native";

export default function ClassesScreen() {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { t } = useTranslation();

  const [myBookings, setMyBookings] = useState<Set<string>>(new Set());
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1. Fetch Classes
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (classesError) throw classesError;
      setClasses(classesData || []);

      const classIds = classesData?.map((c) => c.id) || [];

      // 2. Fetch User's Bookings (if logged in)
      if (user && classIds.length > 0) {
        const { data: userBookings } = await supabase
          .from("bookings")
          .select("class_id")
          .eq("user_id", user.id)
          .in("class_id", classIds)
          .in("status", ["confirmed", "checked_in"]); // exclude cancelled

        const bookedSet = new Set(userBookings?.map((b) => b.class_id) || []);
        setMyBookings(bookedSet);
      }

      // 3. Fetch Booking Counts (Aggregation)
      // Since Supabase doesn't support easy "groupBy" count in client without View/RPC,
      // and we want avoid fetching ALL bookings.
      // Approach: Fetch all "confirmed" bookings for these classIds.
      // Optimization: For production, use a View/RPC. For MVP, this is acceptable.
      if (classIds.length > 0) {
        const { data: allBookings } = await supabase
          .from("bookings")
          .select("class_id")
          .in("class_id", classIds)
          .in("status", ["confirmed", "checked_in"]);

        const counts: Record<string, number> = {};
        allBookings?.forEach((b) => {
          counts[b.class_id] = (counts[b.class_id] || 0) + 1;
        });
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
      // 0. Check Capacity (Client-side optimistic check)
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

      // 2. Check duplicate booking
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
      });

      if (bookError) throw bookError;

      Alert.alert(
        t("classes.booking_success"),
        t("classes.booking_success_msg")
      );
      fetchData(); // Refresh counts and status
    } catch (error: any) {
      Alert.alert(t("classes.booking_error"), error.message);
    } finally {
      setBookingId(null);
    }
  }

  return (
    <View className="flex-1 bg-background pt-12 px-4">
      <View className="mb-6">
        <Text className="text-3xl font-bold text-white">
          {t("classes.title")}
        </Text>
        <Text className="text-gray-400 mt-1">{t("classes.subtitle")}</Text>
      </View>

      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
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
      />
    </View>
  );
}
