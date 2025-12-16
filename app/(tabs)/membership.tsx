import MembershipCard from "@/components/MembershipCard";
import { supabase } from "@/lib/supabase";
import { MembershipPlan } from "@/lib/types";
import { useStripe } from "@stripe/stripe-react-native";
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

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

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

    try {
      // 1. Call Edge Function to create PaymentIntent
      const { data, error: functionError } = await supabase.functions.invoke(
        "payment-sheet",
        {
          body: { planId, userId: user.id },
        }
      );

      if (functionError) {
        throw new Error(
          "Edge Function Error: " +
            (functionError.message || JSON.stringify(functionError))
        );
      }

      if (!data?.paymentIntent || !data?.ephemeralKey || !data?.customer) {
        throw new Error("Invalid response from payment-sheet function");
      }

      const { paymentIntent, ephemeralKey, customer } = data;

      // 2. Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Gymbros",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        defaultBillingDetails: {
          name: user.user_metadata?.name || "Gymbros Member",
        },
      });

      if (initError) {
        throw new Error("Init Payment Sheet Error: " + initError.message);
      }

      // 3. Present Payment Sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === "Canceled") {
          // User canceled, just return
          setPurchasingId(null);
          return;
        }
        throw new Error("Payment Failed: " + paymentError.message);
      }

      // 4. Payment Success! Activate Membership
      // Ideally, a Webhook handles this. For MVP, we insert client-side.
      await activateMembership(user.id, planId);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Lỗi thanh toán", e.message || "Đã có lỗi xảy ra.");
    } finally {
      setPurchasingId(null);
    }
  }

  async function activateMembership(userId: string, planId: string) {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration_months);

    const { error } = await supabase.from("user_memberships").insert({
      user_id: userId,
      plan_id: planId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: "active",
    });

    if (error) {
      Alert.alert(
        "Lỗi kích hoạt",
        "Thanh toán thành công nhưng lỗi kích hoạt: " + error.message
      );
    } else {
      Alert.alert(
        "Thành công! 🎉",
        `Bạn đã thanh toán và đăng ký thành công gói ${plan.name}.`
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
