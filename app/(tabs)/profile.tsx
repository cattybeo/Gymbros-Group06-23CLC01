import Colors from "@/constants/Colors";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, useColorScheme, View } from "react-native";

export default function ProfileScreen() {
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const { showAlert, CustomAlertComponent } = useCustomAlert();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const [loading, setLoading] = useState(true);
  const [memberTier, setMemberTier] = useState(t("home.tier.standard"));
  const [stats, setStats] = useState({
    workouts: 0,
    calories: 0,
    minutes: 0,
    bmi: 0,
  });

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      const fetchData = async () => {
        try {
          // Parallel Fetch using Promise.all
          const [bodyResponse, memberResponse] = await Promise.all([
            supabase
              .from("body_indices")
              .select("weight, height, age, gender")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("user_memberships")
              .select(
                "end_date, plan:membership_plans(id, tier:membership_tiers(name, code))"
              )
              .eq("user_id", user.id)
              .gte("end_date", new Date().toISOString())
              .order("end_date", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          // 1. Process Body Data & Real Stats
          let bmr = 0;
          let totalSessions = 0;
          let totalMinutes = 0;

          if (bodyResponse.data) {
            const { weight, height, age, gender } = bodyResponse.data;

            if (weight && height && age) {
              if (gender === "Male" || gender === "male") {
                bmr = 10 * weight + 6.25 * height - 5 * age + 5;
              } else {
                bmr = 10 * weight + 6.25 * height - 5 * age - 161;
              }
            }
          }

          // Fetch Bookings + Classes for Stats (Client-side aggregation for now)
          const { data: bookingsData } = await supabase
            .from("bookings")
            .select("class:classes(start_time, end_time)")
            .eq("user_id", user.id)
            .eq("status", "confirmed");

          if (bookingsData) {
            totalSessions = bookingsData.length;
            bookingsData.forEach((booking: any) => {
              if (booking.class) {
                const start = new Date(booking.class.start_time).getTime();
                const end = new Date(booking.class.end_time).getTime();
                const durationMin = (end - start) / (1000 * 60);
                totalMinutes += durationMin;
              }
            });
          }

          // Calculate BMI
          let calculatedBmi = 0;
          if (bodyResponse.data?.weight && bodyResponse.data?.height) {
            const h = bodyResponse.data.height / 100;
            calculatedBmi = bodyResponse.data.weight / (h * h);
          }

          setStats({
            workouts: totalSessions,
            calories: Math.round(bmr),
            minutes: Math.round(totalMinutes),
            bmi: calculatedBmi,
          });

          // 2. Process Membership Data
          if (memberResponse.data?.plan) {
            const planData = memberResponse.data.plan as any;
            let tierName = "Standard";
            if (planData.tier) {
              tierName = planData.tier.name;
            } else if (planData.name) {
              tierName = planData.name;
            }

            let translatedTier = t("home.tier.standard");
            if (tierName.toLowerCase().includes("silver")) {
              translatedTier = t("home.tier.silver");
            } else if (tierName.toLowerCase().includes("gold")) {
              translatedTier = t("home.tier.gold");
            } else if (tierName.toLowerCase().includes("platinum")) {
              translatedTier = t("home.tier.platinum");
            }
            setMemberTier(translatedTier);
          } else {
            setMemberTier(t("home.tier.standard"));
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [user, t])
  );

  const STATS = [
    {
      label: t("profile.workouts"),
      value: stats.workouts.toString(),
      unit: t("profile.unit_session"),
    },
    {
      label: t("profile.calories"),
      value: stats.calories.toString(),
      unit: t("profile.unit_kcal"),
    },
    {
      label: t("profile.minutes"),
      value: stats.minutes.toString(),
      unit: t("profile.unit_min"),
    },
  ];

  const MENU_ITEMS = [
    {
      label: t("profile.edit_profile"),
      icon: "user",
      action: () => router.push("/profile/edit"),
    },
    {
      label: t("auth.change_password"),
      icon: "lock",
      action: () => router.push("/profile/change-password"),
    },
    {
      label: t("profile.body_index"),
      icon: "heartbeat",
      action: () => router.push("/profile/body-index"),
    },
    {
      label: t("profile.notifications"),
      icon: "bell",
      action: () =>
        showAlert(t("profile.notifications"), t("common.feature_coming_soon")),
    },
    {
      label: t("profile.privacy_policy"),
      icon: "shield",
      action: () => router.push("/profile/privacy-policy"),
    },
    {
      label: t("profile.settings"),
      icon: "cog",
      action: () => router.push("/profile/settings"),
    },
  ];

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    t("common.default_user_name");

  return (
    <>
      {loading && (
        <View className="flex-1 bg-background items-center justify-center">
          <ActivityIndicator size="large" color={colors.tint} />
          <Text className="text-muted_foreground mt-4">{t("common.loading") || "Loading..."}</Text>
        </View>
      )}
      <ScrollView
        className="flex-1 bg-background"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <View className="items-center pt-16 pb-8 bg-card rounded-b-[30px] shadow-sm mb-6 border-b border-border">
        <View className="mb-4 relative">
          <View className="w-24 h-24 rounded-full bg-card items-center justify-center border-4 border-background overflow-hidden relative">
            {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
              <Image
                source={{
                  uri:
                    user?.user_metadata?.avatar_url ||
                    user?.user_metadata?.picture,
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Text className="text-3xl font-bold text-muted_foreground">
                {user?.user_metadata?.full_name
                  ? user.user_metadata.full_name.charAt(0).toUpperCase()
                  : user?.email?.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          {/* Status Indicator (Optional) */}
          <View className="absolute bottom-1 right-1 w-6 h-6 bg-success rounded-full border-4 border-card" />
        </View>
        <Text className="text-foreground text-2xl font-bold mb-1">
          {displayName}
        </Text>
        <Text className="text-muted_foreground text-sm">{user?.email}</Text>
        <Text className="text-primary font-bold text-xs mt-2 bg-card border border-primary/30 px-3 py-1 rounded-full uppercase tracking-wider">
          {memberTier}
        </Text>
      </View>

      <View className="px-6 mb-6">
        <View className="bg-card border border-border rounded-3xl p-5 flex-row justify-between items-center shadow-sm">
          <View className="flex-1 mr-4">
            <Text className="text-muted_foreground text-xs font-bold uppercase mb-1">
              {t("profile.goal_label")}
            </Text>
            <Text className="text-foreground text-lg font-bold flex-wrap">
              {user?.user_metadata?.goal
                ? t(`profile.goals.${user.user_metadata.goal}`)
                : t("profile.not_set")}
            </Text>
          </View>
          <View className="items-end min-w-[60px]">
            <Text className="text-muted_foreground text-xs font-bold uppercase mb-1">
              BMI
            </Text>
            <Text className="text-primary text-2xl font-black">
              {stats.bmi > 0 ? stats.bmi.toFixed(1) : "--"}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View className="px-6 mb-8 flex-row justify-between">
        {STATS.map((stat, index) => (
          <View
            key={index}
            className="bg-card w-[30%] p-3 rounded-3xl items-center border border-border shadow-sm"
          >
            <Text className="text-primary text-xl font-bold">{stat.value}</Text>
            <Text className="text-muted_foreground text-xs mt-1">
              {stat.unit}
            </Text>
            <Text className="text-muted_foreground text-[10px] mt-1 uppercase">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Menu Options */}
      <View className="px-6 mb-8">
        <Text className="text-foreground font-bold text-lg mb-4">
          {t("profile.general")}
        </Text>
        <View className="bg-card rounded-3xl overflow-hidden border border-border shadow-sm">
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              className={`flex-row items-center p-4 ${
                index !== MENU_ITEMS.length - 1 ? "border-b border-border" : ""
              }`}
              onPress={() => {
                if (item.action) {
                  item.action();
                } else {
                  showAlert(
                    "Feature coming soon",
                    "This feature is under development."
                  );
                }
              }}
            >
              <View className="w-8 h-8 bg-background rounded-full items-center justify-center mr-4">
                <FontAwesome
                  name={item.icon as any}
                  size={14}
                  color={colors.tint}
                />
              </View>
              <Text className="text-foreground flex-1 font-medium">
                {item.label}
              </Text>
              <FontAwesome
                name="angle-right"
                size={16}
                color={colors.tabIconDefault}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logout Button */}
      <View className="px-6 pb-20">
        <TouchableOpacity
          className="w-full bg-card border border-destructive/50 p-4 rounded-2xl flex-row items-center justify-center shadow-sm"
          onPress={() => {
            showAlert(
              t("profile.logout"),
              t("auth.logout_confirmation"),
              "warning",
              {
                primaryButtonText: t("common.confirm"),
                secondaryButtonText: t("common.cancel"),
                onPrimaryPress: () => supabase.auth.signOut(),
              }
            );
          }}
        >
          <FontAwesome name="sign-out" size={18} color={colors.error} />
          <Text className="text-destructive font-bold ml-2">
            {t("profile.logout")}
          </Text>
        </TouchableOpacity>
      </View>

      <CustomAlertComponent />
    </ScrollView>
    </>
  );
}
