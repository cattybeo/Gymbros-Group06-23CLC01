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

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    setLoading(true);
    // Fetch future classes only
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true });

    if (error) {
      Alert.alert(t("common.error"), t("classes.empty_list")); // Or a generic fetch error if we had one
      console.error(error);
    } else {
      setClasses(data || []);
    }
    setLoading(false);
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
        renderItem={({ item }) => (
          <ClassCard
            gymClass={item}
            onBook={handleBook}
            isBooking={bookingId === item.id}
          />
        )}
        refreshing={loading}
        onRefresh={fetchClasses}
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
