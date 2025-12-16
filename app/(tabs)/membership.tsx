import MembershipCard from "@/components/MembershipCard";
import { supabase } from "@/lib/supabase";
import { MembershipPlan } from "@/lib/types";
import { useStripe } from "@stripe/stripe-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, Text, View } from "react-native";

export default function MembershipScreen() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<MembershipPlan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    setLoading(true);
    try {
      // 1. Fetch Plans
      const { data: plansData, error: plansError } = await supabase
        .from("membership_plans")
        .select("*")
        .order("price", { ascending: true }); // Order by price for upgrade logic

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // 2. Fetch User's Active Membership
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: membershipData, error: membershipError } = await supabase
          .from("user_memberships")
          .select("plan_id, membership_plans(*)") // Join with plans
          .eq("user_id", user.id)
          .gte("end_date", new Date().toISOString()) // Relaxed check
          .order("end_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (membershipError && membershipError.code !== "PGRST116") {
          console.error("Error fetching membership:", membershipError);
        }

        if (membershipData && membershipData.membership_plans) {
          // @ts-ignore
          setCurrentPlan(membershipData.membership_plans);
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Không thể tải dữ liệu gói tập");
    } finally {
      setLoading(false);
    }
  }

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Helper to determine status
  function getPlanStatus(
    plan: MembershipPlan
  ): "default" | "current" | "upgrade" | "downgrade" {
    if (!currentPlan) return "default";
    if (plan.id === currentPlan.id) return "current";
    if (plan.price > currentPlan.price) return "upgrade";
    return "downgrade";
  }

  async function handleBuy(planId: string) {
    // ... existing handleBuy code ...
  }

  // ... activateMembership function ...

  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-background pt-12 px-4">
      <View className="mb-6">
        <Text className="text-3xl font-bold text-white">
          {t("membership.title")}
        </Text>
        <Text className="text-gray-400 mt-1">{t("membership.subtitle")}</Text>
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <MembershipCard
            plan={item}
            onBuy={handleBuy}
            isLoading={purchasingId === item.id}
            status={getPlanStatus(item)}
          />
        )}
        refreshing={loading}
        onRefresh={fetchPlans}
        ListEmptyComponent={
          !loading ? (
            <Text className="text-center text-gray-500 mt-10">
              {t("membership.empty_list")}
            </Text>
          ) : null
        }
      />
    </View>
  );
}
