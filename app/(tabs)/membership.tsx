import MembershipCard from "@/components/MembershipCard";
import { supabase } from "@/lib/supabase";
import { MembershipPlan } from "@/lib/types";
import { useEffect, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";

export default function MembershipScreen() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    setLoading(true);
    const { data, error } = await supabase.from("membership_plans").select("*");
    if (error) {
      Alert.alert("Lỗi", "Không thể tải danh sách gói tập");
      console.error(error);
    } else {
      setPlans(data || []);
    }
    setLoading(false);
  }

  async function handleBuy(planId: string) {
    // Check login
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert("Yêu cầu đăng nhập", "Vui lòng đăng nhập để mua gói tập.");
      return;
    }

    setPurchasingId(planId);

    // Calculate dates
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration_months);

    // Insert to user_memberships
    const { error } = await supabase.from("user_memberships").insert({
      user_id: user.id,
      plan_id: planId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: "active",
    });

    setPurchasingId(null);

    if (error) {
      Alert.alert("Thất bại", "Mua gói tập không thành công: " + error.message);
    } else {
      Alert.alert(
        "Thành công! 🎉",
        `Bạn đã đăng ký thành công gói ${plan.name}.`
      );
    }
  }

  return (
    <View className="flex-1 bg-background pt-12 px-4">
      <View className="mb-6">
        <Text className="text-3xl font-bold text-white">Gói Hội Viên</Text>
        <Text className="text-gray-400 mt-1">
          Chọn gói tập phù hợp với mục tiêu của bạn
        </Text>
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MembershipCard
            plan={item}
            onBuy={handleBuy}
            isLoading={purchasingId === item.id}
          />
        )}
        refreshing={loading}
        onRefresh={fetchPlans}
        ListEmptyComponent={
          !loading ? (
            <Text className="text-center text-gray-500 mt-10">
              Chưa có gói tập nào được mở bán.
            </Text>
          ) : null
        }
      />
    </View>
  );
}
