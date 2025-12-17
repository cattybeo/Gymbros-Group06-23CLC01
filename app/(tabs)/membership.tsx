import MembershipCard from "@/components/MembershipCard";
import { supabase } from "@/lib/supabase";
import { MembershipPlan, MembershipTier } from "@/lib/types"; // Fixed import
import { useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native"; // Fixed import

export default function MembershipScreen() {
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<MembershipPlan | null>(null);
  const [isYearly, setIsYearly] = useState(false); // Toggle state

  const { t } = useTranslation();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // 1. Fetch Tiers
      const { data: tiersData, error: tiersError } = await supabase
        .from("membership_tiers")
        .select("*")
        .order("level", { ascending: true });

      if (tiersError) throw tiersError;
      setTiers(tiersData || []);

      // 2. Fetch Plans
      const { data: plansData, error: plansError } = await supabase
        .from("membership_plans")
        .select("*")
        .eq("is_active", true);

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // 3. Fetch User's Active Membership
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Note: nesting is user_memberships -> plan:membership_plans -> tier:membership_tiers
        const { data: membershipData, error: membershipError } = await supabase
          .from("user_memberships")
          .select("plan_id, plan:membership_plans(*)")
          .eq("user_id", user.id)
          .gte("end_date", new Date().toISOString())
          .order("end_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (membershipError && membershipError.code !== "PGRST116") {
          console.error("Error fetching membership:", membershipError);
        }

        if (membershipData && membershipData.plan) {
          setCurrentPlan(membershipData.plan as unknown as MembershipPlan);
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t("common.error"), "Không thể tải dữ liệu gói tập");
    } finally {
      setLoading(false);
    }
  }

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // Helper to get status
  function getPlanStatus(
    tierLevel: number
  ): "default" | "current" | "upgrade" | "downgrade" {
    // This logic is a bit complex now because we compare Tiers, not just Plans.
    // If user has ANY plan in a Tier, that Tier is "Current" logic-wise?
    // Let's simplify: compare Levels.
    // We need to know the Level of the current User's plan.
    if (!currentPlan) return "default";

    // We need to find the tier of the current plan.
    const currentTierId = currentPlan.tier_id;
    const currentTier = tiers.find((t) => t.id === currentTierId);
    if (!currentTier) return "default";

    if (currentTier.level === tierLevel) return "current";
    if (tierLevel > currentTier.level) return "upgrade";
    return "downgrade";
  }

  async function handleBuy(planId: string) {
    if (loading || !planId) return;
    setPurchasingId(planId);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(t("common.error"), "Vui lòng đăng nhập để mua gói tập.");
        router.push("/(auth)/sign-in");
        return;
      }

      // Edge Function (remains same logic, just passing new planId)
      const { data, error } = await supabase.functions.invoke("payment-sheet", {
        body: { planId, userId: user.id },
      });

      if (error || !data) {
        throw new Error(error?.message || "Không thể khởi tạo thanh toán");
      }

      const { paymentIntent, ephemeralKey, customer } = data;

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "Gymbros",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        defaultBillingDetails: {
          name: "Gymbro Member",
        },
      });

      if (initError) throw new Error(initError.message);

      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code !== "Canceled") {
          Alert.alert(t("common.error"), paymentError.message);
        }
      } else {
        await activateMembership(user.id, planId);
      }
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message);
    } finally {
      setPurchasingId(null);
    }
  }

  async function activateMembership(userId: string, planId: string) {
    try {
      setLoading(true);
      const selectedPlan = plans.find((p) => p.id === planId);
      const durationMonths = selectedPlan?.duration_months || 1;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(startDate.getMonth() + durationMonths);

      const { error } = await supabase.from("user_memberships").insert({
        user_id: userId,
        plan_id: planId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
      });

      if (error) throw error;

      Alert.alert(t("common.success"), "Đăng ký gói tập thành công!");
      fetchData(); // Refresh
    } catch (error: any) {
      Alert.alert(t("common.error"), "Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Filter plans based on Toggle (Monthly vs Yearly)
  // Monthly = duration_months <= 3 ? Or strictly 1?
  // Requirement: "Monthly/Yearly".
  // Let's assume Yearly is >= 12 months. Monthly is < 12.
  // Or better: Use the toggle to show specific plans.
  // Most tiers have 1 month and some have 3, 6, 12.
  // Let's just group by Tier and show the PRIMARY plan for that toggle state.
  // If Yearly is selected, show the 12-month plan (if exists).
  // If Monthly is selected, show the 1-month plan.

  return (
    <View className="flex-1 bg-background pt-12 px-4">
      <View className="mb-4">
        <Text className="text-3xl font-bold text-white">
          {t("membership.title")}
        </Text>
        <Text className="text-gray-400 mt-1">{t("membership.subtitle")}</Text>
      </View>

      {/* Toggle */}
      <View className="flex-row bg-gray-800 p-1 rounded-xl mb-6 self-start">
        <TouchableOpacity
          className={`px-4 py-2 rounded-lg ${
            !isYearly ? "bg-primary" : "bg-transparent"
          }`}
          onPress={() => setIsYearly(false)}
        >
          <Text
            className={`font-bold ${!isYearly ? "text-black" : "text-gray-400"}`}
          >
            {t("membership.month")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-4 py-2 rounded-lg ${
            isYearly ? "bg-primary" : "bg-transparent"
          }`}
          onPress={() => setIsYearly(true)}
        >
          <Text
            className={`font-bold ${isYearly ? "text-black" : "text-gray-400"}`}
          >
            Yearly (-20%)
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tiers}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: tier }) => {
          // Find relevant plan for this tier and mode
          const relevantPlans = plans.filter((p) => p.tier_id === tier.id);
          // Simple logic: If Yearly, find max duration. If Monthly, find min duration.
          // This can be refined.
          const selectedPlan = isYearly
            ? relevantPlans.find((p) => p.duration_months >= 12)
            : relevantPlans.find((p) => p.duration_months === 1);

          if (!selectedPlan) return null; // Don't show tier if no plan for this mode

          return (
            <MembershipCard
              // We need to update MembershipCard to accept "Tier" and "Plan" separately probably?
              // Or just map it to the old structure if we want to reuse?
              // Let's assume we refactor MembershipCard too or pass props appropriately.
              // Since I can't see MembershipCard internals here, I will treat it as needing refactor or fitting props.
              // The old prop was `plan`.
              // Let's construct a hybrid object or check MembershipCard file.
              // For now, I will pass the Tier + Plan info.
              plan={
                {
                  ...selectedPlan,
                  name: tier.name, // Display Tier Name
                  description: null, // Description is now Features
                  image_slug: tier.image_slug,
                } as any
              }
              tier={tier} // Pass full tier for features
              onBuy={() => handleBuy(selectedPlan.id)}
              isLoading={purchasingId === selectedPlan.id}
              status={getPlanStatus(tier.level)}
            />
          );
        }}
        refreshing={loading}
        onRefresh={fetchData}
        ListEmptyComponent={
          <Text className="text-center text-gray-500 mt-10">
            {t("membership.empty_list")}
          </Text>
        }
      />
    </View>
  );
}
