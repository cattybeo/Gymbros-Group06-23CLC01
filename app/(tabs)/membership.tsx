import MembershipCard from "@/components/MembershipCard";
import { DurationSelectorSkeleton } from "@/components/ui/DurationSelectorSkeleton";
import { MembershipCardSkeleton } from "@/components/ui/MembershipCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { supabase } from "@/lib/supabase";
import { MembershipPlan, MembershipTier } from "@/lib/types";
import { useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MembershipScreen() {
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentOpacity] = useState(new Animated.Value(0));
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<MembershipPlan | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<1 | 3 | 6 | 12>(1);
  const durationOptions = [1, 3, 6, 12];

  const { t } = useTranslation();
  const { showAlert, CustomAlertComponent } = useCustomAlert();

  const fetchData = useCallback(async () => {
    setLoading(true);
    contentOpacity.setValue(0);
    try {
      const [tiersRes, plansRes, authRes] = await Promise.all([
        supabase
          .from("membership_tiers")
          .select("*")
          .order("level", { ascending: true }),
        supabase.from("membership_plans").select("*").eq("is_active", true),
        supabase.auth.getUser(),
      ]);

      if (tiersRes.error) throw tiersRes.error;
      if (plansRes.error) throw plansRes.error;

      setTiers(tiersRes.data || []);
      setPlans(plansRes.data || []);

      const user = authRes.data.user;
      if (user) {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD for date comparison
        const { data: membershipData, error: membershipError } = await supabase
          .from("user_memberships")
          .select("plan_id, plan:membership_plans(*), status")
          .eq("user_id", user.id)
          .eq("status", "active") // Only show 'active' as the current plan
          .lte("start_date", today) // Must have started
          .gte("end_date", today) // Must not have expired
          .order("end_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (membershipError && membershipError.code !== "PGRST116") {
          console.error("Error fetching membership:", membershipError);
        }

        if (membershipData && membershipData.plan) {
          setCurrentPlan(membershipData.plan as unknown as MembershipPlan);
        } else {
          setCurrentPlan(null); // Explicitly clear if no active membership
        }
      }
    } catch (error) {
      console.error(error);
      showAlert(t("common.error"), t("membership.load_failed"), "error");
    } finally {
      setLoading(false);
    }
  }, [contentOpacity, t, showAlert]);

  // Premium Fade-in Transition
  useEffect(() => {
    if (!loading) {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500, // Smoother timing for premium feel
        useNativeDriver: true,
      }).start();
    }
  }, [loading, contentOpacity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  function getPlanStatus(
    tierLevel: number,
    targetTierId: string
  ): "default" | "current" | "upgrade" | "downgrade" {
    if (!currentPlan) {
      if (tierLevel === 1) return "current";
      return "upgrade";
    }

    const currentTierId = currentPlan.tier_id;
    const currentTier = tiers.find((t) => t.id === currentTierId);
    if (!currentTier) return "default";

    // Same tier = current (user already has this tier, regardless of duration)
    if (currentTierId === targetTierId) return "current";

    if (tierLevel > currentTier.level) return "upgrade";
    if (tierLevel < currentTier.level) return "downgrade";

    return "default";
  }

  async function handleBuy(planId: string) {
    if (loading || !planId) return;
    setPurchasingId(planId);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        showAlert(
          t("common.error"),
          t("membership.login_required_buy"),
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
        allowsDelayedPaymentMethods: false,
        returnURL: "gymbros://stripe-redirect",
        defaultBillingDetails: {
          name: "Gymbro Member",
        },
      });

      if (initError) throw new Error(initError.message);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code !== "Canceled") {
          await new Promise((resolve) => setTimeout(resolve, 500));
          showAlert(t("common.error"), paymentError.message, "error");
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
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
    const maxAttempts = 12;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const { data } = await supabase
          .from("user_memberships")
          .select("id")
          .eq("user_id", userId)
          .eq("plan_id", planId)
          .eq("status", "active")
          .gte("created_at", new Date(Date.now() - 300000).toISOString())
          .maybeSingle();

        if (data) {
          clearInterval(interval);
          // Fetch data first, then show alert after completion
          await fetchData();
          showAlert(
            t("common.success"),
            t("membership.activation_success"),
            "success"
          );
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          // Fetch data first, then show alert after completion
          await fetchData();
          showAlert(
            t("common.success"),
            t("membership.activation_pending"),
            "success"
          );
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setLoading(false);
        }
      }
    }, 2000);
  }

  async function handleCancel() {
    showAlert(
      t("common.confirm_buy"),
      t("common.cancel_membership_confirm"),
      "warning",
      {
        primaryButtonText: t("common.keep_membership"),
        secondaryButtonText: t("common.cancel_membership"),
        onSecondaryPress: async () => {
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
                t("common.error"),
                t("membership.no_active_found"),
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

  const PageSkeleton = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="flex-1"
      contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
    >
      {/* Header Skeleton */}
      <View className="mb-4">
        <Skeleton width={200} height={36} borderRadius={4} />
        <View className="mt-2">
          <Skeleton width={150} height={16} borderRadius={4} />
        </View>
      </View>

      {/* Duration Selector Skeleton */}
      <DurationSelectorSkeleton />

      {/* Cards Skeleton */}
      <MembershipCardSkeleton />
      <MembershipCardSkeleton />
    </ScrollView>
  );

  return (
    <View className="flex-1 bg-background pt-24 px-4">
      {loading ? (
        <PageSkeleton />
      ) : (
        <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
          {/* Actual Content */}
          <View className="mb-4">
            <Text className="text-3xl font-bold text-foreground">
              {t("membership.title")}
            </Text>
            <Text className="text-muted_foreground mt-1">
              {t("membership.subtitle")}
            </Text>
          </View>

          {/* Duration Selector */}
          <View className="mb-6">
            <View className="flex-row bg-card p-1 rounded-3xl border border-border justify-between relative shadow-sm">
              {durationOptions.map((duration) => (
                <TouchableOpacity
                  key={duration}
                  accessibilityRole="button"
                  className={`flex-1 py-3 items-center rounded-2xl relative z-10 ${
                    selectedDuration === duration
                      ? "bg-primary shadow-sm"
                      : "bg-transparent"
                  }`}
                  onPress={() => setSelectedDuration(duration as any)}
                >
                  {duration === 6 && (
                    <View className="absolute -top-3 z-20 bg-accent px-2 py-0.5 rounded-full shadow-sm border border-white/20">
                      <Text className="text-[10px] font-bold text-on_accent">
                        {t("membership.popular")}
                      </Text>
                    </View>
                  )}
                  {duration === 12 && (
                    <View className="absolute -top-3 z-20 bg-error px-2 py-0.5 rounded-full shadow-sm border border-white/20">
                      <Text className="text-[10px] font-bold text-white">
                        {t("membership.best_value")}
                      </Text>
                    </View>
                  )}
                  <Text
                    className={`font-bold text-sm ${
                      selectedDuration === duration
                        ? "text-on_primary"
                        : "text-muted_foreground"
                    }`}
                  >
                    {duration === 12
                      ? t("membership.1_year")
                      : t("membership.month_count", { count: duration })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text className="text-center text-xs text-muted_foreground mt-3 italic opacity-80">
              {t("membership.save_hint")}
            </Text>
          </View>

          <FlatList
            data={tiers}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: tier }) => {
              if (selectedDuration > 1 && tier.level === 1) return null;

              const relevantPlans = plans.filter((p) => p.tier_id === tier.id);
              const selectedPlan = relevantPlans.find(
                (p) => p.duration_months === selectedDuration
              );

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
                    duration={selectedDuration}
                    onBuy={() => handleBuy(selectedPlan.id)}
                    isLoading={purchasingId === selectedPlan.id}
                    status={getPlanStatus(tier.level, tier.id)}
                  />
                  {isMyCurrentPlan && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      className="bg-destructive/10 border border-destructive p-3 rounded-lg -mt-2 mb-4 mx-4 items-center"
                      onPress={() => handleCancel()}
                    >
                      <Text className="text-destructive font-bold">
                        {t("common.cancel_membership")}
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
        </Animated.View>
      )}
      <CustomAlertComponent />
    </View>
  );
}
