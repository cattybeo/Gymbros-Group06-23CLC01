import Colors from "@/constants/Colors";
import { GYM_IMAGES } from "@/constants/Images";
import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import {
  BarcodeCreatorView,
  BarcodeFormat,
} from "react-native-barcode-creator";

export default function HomeScreen() {
  const { user } = useAuthContext();
  const screenWidth = Dimensions.get("window").width;
  const [memberTier, setMemberTier] = useState("STANDARD MEMBER"); // Default state
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

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
            .select("end_date, plan:membership_plans(name)")
            .eq("user_id", user.id)
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

        if (tierResponse.data?.plan) {
          // @ts-ignore
          setMemberTier(tierResponse.data.plan.name.toUpperCase());
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
        text: "text-gray-300",
        icon: colors.silver,
        bg: "bg-gray-400",
        label: t("home.tier.silver"),
      };
    }
    if (tier.includes("GOLD")) {
      return {
        text: "text-yellow-500",
        icon: colors.gold,
        bg: "bg-yellow-500",
        label: t("home.tier.gold"),
      };
    }
    if (tier.includes("PLATINUM")) {
      return {
        text: "text-cyan-400",
        icon: colors.platinum,
        bg: "bg-cyan-400",
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
      <View className="pt-12 px-6 mb-6">
        <Text className="text-gray-400 text-sm">{t("home.welcome")}</Text>
        <Text className="text-white text-2xl font-bold">
          {user?.email?.split("@")[0] || "Gymbro"}
        </Text>
      </View>

      {/* Digital Membership Card */}
      <View className="px-6 mb-8">
        <View className="bg-surface rounded-2xl p-6 border border-gray-800 shadow-sm relative overflow-hidden">
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
              <Text className="text-gray-500 text-xs tracking-wider">
                {tierStyle.label}
              </Text>
            </View>
            <FontAwesome name="diamond" size={24} color={tierStyle.icon} />
          </View>

          <View className="flex-row justify-between items-end mb-6">
            <View>
              <Text className="text-gray-400 text-xs mb-1">
                {t("home.member_name")}
              </Text>
              <Text className="text-white font-bold text-lg uppercase">
                {user?.email?.split("@")[0] || "MEMBER"}
              </Text>
            </View>
          </View>

          {/* Barcode - Full Width */}
          <View className="bg-white pt-4 pb-2 px-2 rounded-xl items-center justify-center w-full overflow-hidden">
            {user && (
              <BarcodeCreatorView
                value={user.id}
                format={BarcodeFormat.CODE128}
                background="#FFFFFF"
                foregroundColor="#000000"
                style={{ height: 60, width: screenWidth - 48 - 48 }}
              />
            )}
            <Text className="text-black text-[10px] mt-1 tracking-[4px]">
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
            <Text className="text-white font-bold text-xl w-2/3">
              TRANSFORM YOUR BODY WITH POWER PUMP
            </Text>
            <Text style={{ color: colors.tint }} className="font-bold mt-2">
              JOIN NOW &rarr;
            </Text>
          </View>
        </View>
      </View>

      {/* Grid Menu */}
      <View className="px-6 mb-8">
        <Text className="text-white font-bold text-lg mb-4">
          {t("home.quick_access")}
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {MENU_ITEMS.map((item, index) => (
            <View
              key={index}
              className="w-[48%] bg-surface p-4 rounded-xl mb-4 items-center border border-gray-800"
            >
              <View className="w-12 h-12 bg-gray-800 rounded-full items-center justify-center mb-2">
                <FontAwesome
                  name={item.icon as any}
                  size={20}
                  color={colors.tint}
                />
              </View>
              <Text className="text-gray-300 font-medium">{item.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View className="px-6 pb-20">
        <Text className="text-white font-bold text-lg mb-4">
          {t("home.recent_activity")}
        </Text>
        {recentActivity ? (
          <View className="bg-surface rounded-xl p-4 border border-gray-800 flex-row items-center">
            <View
              className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                new Date(recentActivity.booking_date) > new Date()
                  ? "bg-blue-900/50"
                  : "bg-green-900/50"
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
                    ? "#60A5FA"
                    : "#4ADE80"
                }
              />
            </View>
            <View>
              <Text className="text-white font-medium">
                {recentActivity.class?.name || "Group Class"}
              </Text>
              <Text className="text-gray-500 text-xs">
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
          <Text className="text-gray-500 text-center italic">
            {t("home.no_activity")}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
