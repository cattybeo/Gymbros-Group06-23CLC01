import Colors from "@/constants/Colors";
import { GYM_IMAGES } from "@/constants/Images";
import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import { FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Image, ScrollView, Text, View } from "react-native";
import {
  BarcodeCreatorView,
  BarcodeFormat,
} from "react-native-barcode-creator";

export default function HomeScreen() {
  const { user } = useAuthContext();
  const { t, i18n } = useTranslation();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];
  const screenWidth = Dimensions.get("window").width;
  const [memberTier, setMemberTier] = useState(t("home.tier.standard")); // Default state

  const [recentActivity, setRecentActivity] = useState<any>(null);

  // Fetch Member Tier & Recent Activity
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [tierResponse, activityResponse] = await Promise.all([
          // 1. Fetch Tier
          supabase
            .from("user_memberships")
            .select("end_date, plan:membership_plans(membership_tiers(name))")
            .eq("user_id", user.id)
            .eq("status", "active")
            .gte("end_date", new Date().toISOString())
            .order("end_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
          // 2. Fetch Recent Activity (Latest Booking)
          supabase
            .from("bookings")
            .select("booking_date, class:classes(name)")
            .eq("user_id", user.id)
            .order("booking_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (tierResponse.data && tierResponse.data.plan) {
          const planData = tierResponse.data.plan as any;
          const tierName = planData.membership_tiers?.name || "STANDARD";
          setMemberTier(tierName.toUpperCase());
        }

        if (activityResponse.data) {
          setRecentActivity(activityResponse.data);
        }
      } catch (error) {
        console.error("Error fetching home data:", error);
      }
    };

    fetchData();
  }, [user]);

  // Tier Styling Logic
  const getTierStyle = (tier: string) => {
    if (tier.includes("SILVER")) {
      return {
        text: "text-muted_foreground",
        icon: colors.silver,
        bg: "bg-muted",
        label: t("home.tier.silver"),
      };
    }
    if (tier.includes("GOLD")) {
      return {
        text: "text-warning",
        icon: colors.gold,
        bg: "bg-warning/20",
        label: t("home.tier.gold"),
      };
    }
    if (tier.includes("PLATINUM")) {
      return {
        text: "text-info",
        icon: colors.platinum,
        bg: "bg-info/20",
        label: t("home.tier.platinum"),
      };
    }
    return {
      text: "text-primary",
      icon: colors.tint,
      bg: "bg-primary",
      label: t("home.tier.standard"),
    };
  };

  const tierStyle = getTierStyle(memberTier);

  const MENU_ITEMS = [
    { name: t("home.workout"), icon: "bicycle" },
    { name: t("home.diet"), icon: "leaf" },
    { name: t("home.shop"), icon: "shopping-cart" },
    { name: t("home.blog"), icon: "newspaper-o" },
  ];

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      decelerationRate="fast"
      overScrollMode="never"
    >
      {/* Header */}
      <View className="pt-24 px-6 mb-6">
        <Text className="text-muted_foreground text-sm">
          {t("home.welcome")}
        </Text>
        <Text className="text-foreground text-2xl font-bold">
          {user?.email?.split("@")[0] || t("common.default_user_name")}
        </Text>
      </View>

      {/* Digital Membership Card */}
      <View className="px-6 mb-8">
        <View className="bg-card rounded-2xl p-6 border border-border shadow-sm relative overflow-hidden">
          {/* Card Bg Decoration */}
          <View
            className={`absolute top-0 right-0 w-32 h-32 ${tierStyle.bg} opacity-10 rounded-bl-full translate-x-10 -translate-y-10`}
          />

          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text
                className={`${tierStyle.text} font-bold text-lg tracking-widest`}
              >
                GYMBROS
              </Text>
              <Text className="text-muted_foreground text-xs tracking-wider">
                {tierStyle.label}
              </Text>
            </View>
            <FontAwesome name="diamond" size={24} color={tierStyle.icon} />
          </View>

          <View className="flex-row justify-between items-end mb-6">
            <View>
              <Text className="text-muted_foreground text-xs mb-1">
                {t("home.member_name")}
              </Text>
              <Text className="text-foreground font-bold text-lg uppercase">
                {user?.email?.split("@")[0] || t("home.member_name")}
              </Text>
            </View>
          </View>

          {/* Barcode - Full Width */}
          <View className="bg-card pt-4 pb-2 px-2 rounded-xl items-center justify-center w-full overflow-hidden">
            {user && (
              <BarcodeCreatorView
                value={user.id}
                format={BarcodeFormat.CODE128}
                background={colors.card}
                foregroundColor={colors.text}
                style={{ height: 60, width: screenWidth - 48 - 48 }}
              />
            )}
            <Text className="text-foreground text-[10px] mt-1 tracking-[4px]">
              {user?.id ? user.id.substring(0, 18).toUpperCase() : ""}
            </Text>
          </View>
        </View>
      </View>

      {/* Promotional Banner */}
      <View className="px-6 mb-8">
        <View className="rounded-2xl overflow-hidden h-40 relative">
          <Image
            source={GYM_IMAGES.body_pump}
            className="w-full h-full absolute"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/40 flex-1 justify-center px-6">
            <Text className="text-card-foreground font-bold text-xl w-2/3">
              TRANSFORM YOUR BODY WITH POWER PUMP
            </Text>
            <Text className="text-primary font-bold mt-2">JOIN NOW &rarr;</Text>
          </View>
        </View>
      </View>

      {/* Grid Menu */}
      <View className="px-6 mb-8">
        <Text className="text-foreground font-bold text-lg mb-4">
          {t("home.quick_access")}
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {MENU_ITEMS.map((item, index) => (
            <View
              key={index}
              className="w-[48%] bg-card p-4 rounded-xl mb-4 items-center border border-border"
            >
              <View className="w-12 h-12 bg-background rounded-full items-center justify-center mb-2 border border-border">
                <FontAwesome
                  name={item.icon as any}
                  size={20}
                  color={colors.tint}
                />
              </View>
              <Text className="text-muted_foreground font-medium">
                {item.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View className="px-6 pb-20">
        <Text className="text-foreground font-bold text-lg mb-4">
          {t("home.recent_activity")}
        </Text>
        {recentActivity ? (
          <View className="bg-card rounded-xl p-4 border border-border flex-row items-center">
            <View
              className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                new Date(recentActivity.booking_date) > new Date()
                  ? "bg-info/20"
                  : "bg-success/20"
              }`}
            >
              <FontAwesome
                name={
                  new Date(recentActivity.booking_date) > new Date()
                    ? "calendar"
                    : "check"
                }
                size={16}
                color={
                  new Date(recentActivity.booking_date) > new Date()
                    ? colors.info
                    : colors.success
                }
              />
            </View>
            <View>
              <Text className="text-foreground font-medium">
                {recentActivity.class?.name || t("classes.default_class_name")}
              </Text>
              <Text className="text-muted_foreground text-xs">
                {new Date(recentActivity.booking_date) > new Date()
                  ? t("home.upcoming_class")
                  : t("home.completed_class")}{" "}
                •{" "}
                {new Date(recentActivity.booking_date).toLocaleDateString(
                  i18n.language === "vi" ? "vi-VN" : "en-US",
                  { weekday: "short", day: "numeric", month: "numeric" }
                )}
              </Text>
            </View>
          </View>
        ) : (
          <Text className="text-muted_foreground text-center italic">
            {t("home.no_activity")}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
