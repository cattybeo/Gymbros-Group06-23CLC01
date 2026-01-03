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
          .select("plan_id, plan:membership_plans(*), status") // Select status to check later
          .eq("user_id", user.id)
          .in("status", ["active", "cancelled"]) // Show active AND cancelled (if valid date)
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
    tierLevel: number,
    targetPlanId: string
  ): "default" | "current" | "upgrade" | "downgrade" {
    if (!currentPlan) return "default";

    // 1. If looking at the EXACT same plan I have -> Current
    if (currentPlan.id === targetPlanId) return "current";

    // 2. We need to compare Tiers
    const currentTierId = currentPlan.tier_id;
    const currentTier = tiers.find((t) => t.id === currentTierId);
    if (!currentTier) return "default";

    // 3. Compare Levels
    if (tierLevel > currentTier.level) return "upgrade";
    if (tierLevel < currentTier.level) return "downgrade";

    // 4. Same Level/Tier, but different Plan (e.g. Monthly vs Yearly)
    // Allow buying (Switch cycle/Renew) -> treat as default (Buyable)
    return "default";
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
        // Updated: Wait for Webhook to activate membership
        await waitForMembershipActivation(user.id, planId);
      }
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message);
    } finally {
      setPurchasingId(null);
    }
  }

  async function waitForMembershipActivation(userId: string, planId: string) {
    setLoading(true);
    let attempts = 0;
    const maxAttempts = 5;

    // Polling interval
    const interval = setInterval(async () => {
      attempts++;
      try {
        const { data } = await supabase
          .from("user_memberships")
          .select("id")
          .eq("user_id", userId)
          .eq("plan_id", planId)
          .eq("status", "active")
          .gte("created_at", new Date(Date.now() - 60000).toISOString()) // Created within last minute
          .maybeSingle();

        if (data) {
          clearInterval(interval);
          setLoading(false);
          Alert.alert(t("common.success"), "Đăng ký gói tập thành công!");
          fetchData();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setLoading(false);
          Alert.alert(
            t("common.success"),
            "Thanh toán thành công! Gói tập sẽ được kích hoạt trong ít phút."
          );
          fetchData(); // Just in case
        }
      } catch (e) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 2000); // Check every 2 seconds
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
          const relevantPlans = plans.filter((p) => p.tier_id === tier.id);
          const selectedPlan = isYearly
            ? relevantPlans.find((p) => p.duration_months >= 12)
            : relevantPlans.find((p) => p.duration_months === 1);

          if (!selectedPlan) return null;

          // Check if this card represents the current active plan
          const isMyCurrentPlan =
            currentPlan?.id === selectedPlan.id &&
            tier.level ===
              tiers.find((t) => t.id === currentPlan.tier_id)?.level;

          return (
            <View>
              <MembershipCard
                plan={
                  {
                    ...selectedPlan,
                    name: tier.name,
                    image_slug: tier.image_slug,
                  } as any
                }
                tier={tier}
                onBuy={() => handleBuy(selectedPlan.id)}
                isLoading={purchasingId === selectedPlan.id}
                status={getPlanStatus(tier.level, selectedPlan.id)}
              />
              {/* Cancel Button for Current Plan */}
              {isMyCurrentPlan && (
                <TouchableOpacity
                  className="bg-red-500/10 border border-red-500 p-3 rounded-lg -mt-2 mb-4 mx-4 items-center"
                  onPress={() => handleCancel()}
                >
                  <Text className="text-red-500 font-bold">
                    Hủy gói tập (Cancel)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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

  async function handleCancel() {
    Alert.alert(
      "Xác nhận hủy",
      "Bạn có chắc chắn muốn hủy gói tập hiện tại? Việc này sẽ dừng gia hạn (nếu có) và thay đổi trạng thái gói.",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Hủy gói",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              // Fetch membership ID first (since currentPlan usually doesn't store the membership ID, just plan details)
              // Update: We need the MEMBERSHIP ID, not PLAN ID.
              // Need to refactor `fetchData` to store `membershipId` or fetch it quickly.
              // Fast fix: fetch active membership id for current user again.
              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (!user) return;

              const { data: mem } = await supabase
                .from("user_memberships")
                .select("id")
                .eq("user_id", user.id)
                .eq("status", "active") // Only cancel active memberships
                .maybeSingle();

              if (!mem) {
                Alert.alert(
                  "Lỗi",
                  "Không tìm thấy gói tập đang hoạt động để hủy."
                );
                return;
              }

              const { error } = await supabase.functions.invoke(
                "cancel-membership",
                {
                  body: { membershipId: mem.id },
                }
              );

              if (error) throw error;

              Alert.alert("Thành công", "Đã hủy gói tập.");
              fetchData();
            } catch (e: any) {
              Alert.alert("Lỗi", e.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }
}
