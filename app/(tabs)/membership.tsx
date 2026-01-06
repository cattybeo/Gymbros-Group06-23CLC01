import MembershipCard from "@/components/MembershipCard";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { supabase } from "@/lib/supabase";
import { MembershipPlan, MembershipTier } from "@/lib/types";
import { useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

export default function MembershipScreen() {
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<MembershipPlan | null>(null);
  const [isYearly, setIsYearly] = useState(false);

  const { t } = useTranslation();
  const { showAlert, CustomAlertComponent } = useCustomAlert();

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
        const { data: membershipData, error: membershipError } = await supabase
          .from("user_memberships")
          .select("plan_id, plan:membership_plans(*), status")
          .eq("user_id", user.id)
          .in("status", ["active", "cancelled"])
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
      showAlert(t("common.error"), "Không thể tải dữ liệu gói tập", "error");
    } finally {
      setLoading(false);
    }
  }

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  function getPlanStatus(
    tierLevel: number,
    targetPlanId: string
  ): "default" | "current" | "upgrade" | "downgrade" {
    if (!currentPlan) return "default";
    if (currentPlan.id === targetPlanId) return "current";

    const currentTierId = currentPlan.tier_id;
    const currentTier = tiers.find((t) => t.id === currentTierId);
    if (!currentTier) return "default";

    if (tierLevel > currentTier.level) return "upgrade";
    if (tierLevel < currentTier.level) return "downgrade";

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
        showAlert(
          t("common.error"),
          "Vui lòng đăng nhập để mua gói tập.",
          "error",
          { onClose: () => router.push("/(auth)/sign-in") }
        );
        return;
      }

      const { data, error } = await supabase.functions.invoke("payment-sheet", {
        body: { planId, userId: user.id },
      });

      if (error || !data) {
        throw new Error(error?.message || t("membership.payment_init_error"));
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
          showAlert(t("common.error"), paymentError.message, "error");
        }
      } else {
        await waitForMembershipActivation(user.id, planId);
      }
    } catch (e: any) {
      showAlert(t("common.error"), e.message, "error");
    } finally {
      setPurchasingId(null);
    }
  }

  async function waitForMembershipActivation(userId: string, planId: string) {
    setLoading(true);
    let attempts = 0;
    const maxAttempts = 5;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const { data } = await supabase
          .from("user_memberships")
          .select("id")
          .eq("user_id", userId)
          .eq("plan_id", planId)
          .eq("status", "active")
          .gte("created_at", new Date(Date.now() - 60000).toISOString())
          .maybeSingle();

        if (data) {
          clearInterval(interval);
          setLoading(false);
          showAlert(
            t("common.success"),
            "Đăng ký gói tập thành công!",
            "success"
          );
          fetchData();
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setLoading(false);
          showAlert(
            t("common.success"),
            "Thanh toán thành công! Gói tập sẽ được kích hoạt trong ít phút.",
            "success"
          );
          fetchData();
        }
      } catch (e) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 2000);
  }

  async function handleCancel() {
    showAlert(
      "Xác nhận hủy",
      "Bạn có chắc chắn muốn hủy gói tập hiện tại? Việc này sẽ dừng gia hạn (nếu có) và thay đổi trạng thái gói.",
      "warning",
      {
        primaryButtonText: "Hủy gói",
        secondaryButtonText: "Không",
        onPrimaryPress: async () => {
          setLoading(true);
          try {
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            const { data: mem } = await supabase
              .from("user_memberships")
              .select("id")
              .eq("user_id", user.id)
              .eq("status", "active")
              .maybeSingle();

            if (!mem) {
              showAlert(
                "Lỗi",
                "Không tìm thấy gói tập đang hoạt động để hủy.",
                "error"
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

            showAlert(
              t("common.success"),
              t("membership.cancel_success"),
              "success"
            );
            fetchData();
          } catch (e: any) {
            showAlert(t("common.error"), e.message, "error");
          } finally {
            setLoading(false);
          }
        },
      }
    );
  }

  return (
    <View className="flex-1 bg-background pt-12 px-4">
      <View className="mb-4">
        <Text className="text-3xl font-bold text-foreground">
          {t("membership.title")}
        </Text>
        <Text className="text-muted_foreground mt-1">
          {t("membership.subtitle")}
        </Text>
      </View>

      {/* Toggle */}
      <View className="flex-row bg-card p-1 rounded-xl mb-6 self-start border border-border">
        <TouchableOpacity
          className={`px-4 py-2 rounded-lg ${
            !isYearly ? "bg-primary" : "bg-transparent"
          }`}
          onPress={() => setIsYearly(false)}
        >
          <Text
            className={`font-bold ${!isYearly ? "text-primary_foreground" : "text-muted_foreground"}`}
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
            className={`font-bold ${isYearly ? "text-primary_foreground" : "text-muted_foreground"}`}
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
              {isMyCurrentPlan && (
                <TouchableOpacity
                  className="bg-destructive/10 border border-destructive p-3 rounded-lg -mt-2 mb-4 mx-4 items-center"
                  onPress={() => handleCancel()}
                >
                  <Text className="text-destructive font-bold">
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
          <Text className="text-center text-muted_foreground mt-10">
            {t("membership.empty_list")}
          </Text>
        }
      />
      <CustomAlertComponent />
    </View>
  );
}
