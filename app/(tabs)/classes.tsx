import ClassCard from "@/components/ClassCard";
import { supabase } from "@/lib/supabase";
import { GymClass } from "@/lib/types";
import { useEffect, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";

export default function ClassesScreen() {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

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
      Alert.alert("Lỗi", "Không thể tải danh sách lớp học");
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
      Alert.alert("Yêu cầu", "Vui lòng đăng nhập để đặt lịch.");
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
          "Chưa có gói tập",
          "Bạn cần đăng ký gói hội viên (Membership) để đặt lịch lớp học."
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
        Alert.alert("Thông báo", "Bạn đã đặt lịch cho lớp này rồi.");
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
        "Thành công! ✅",
        "Đặt lịch thành công, hãy đến đúng giờ nhé!"
      );
    } catch (error: any) {
      Alert.alert("Lỗi", "Đặt lịch thất bại: " + error.message);
    } finally {
      setBookingId(null);
    }
  }

  return (
    <View className="flex-1 bg-gray-50 pt-12 px-4">
      <View className="mb-6">
        <Text className="text-3xl font-bold text-gray-900">Lịch Tập</Text>
        <Text className="text-gray-500 mt-1">Các lớp học sắp diễn ra</Text>
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
              Không có lớp học nào sắp tới.
            </Text>
          ) : null
        }
      />
    </View>
  );
}
