import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { user } = useAuthContext();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    workouts: 0,
    calories: 0,
    minutes: 0,
  });
  const [memberTier, setMemberTier] = useState(t("home.tier.standard"));

  useEffect(() => {
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
            .single(),
          supabase
            .from("user_memberships")
            .select("end_date, plan:membership_plans(name)")
            .eq("user_id", user.id)
            .gte("end_date", new Date().toISOString())
            .order("end_date", { ascending: false })
            .limit(1)
            .maybeSingle(), // Use maybeSingle to avoid error if no membership
        ]);

        // 1. Process Body Data & Real Stats
        let bmr = 0;
        let totalSessions = 0;
        let totalMinutes = 0;

        if (bodyResponse.data) {
          const { weight, height, age, gender } = bodyResponse.data;

          if (weight && height && age) {
            if (gender === "Male") {
              bmr = 10 * weight + 6.25 * height - 5 * age + 5;
            } else {
              bmr = 10 * weight + 6.25 * height - 5 * age - 161;
            }
          }
        }

        // Fetch Bookings + Classes for Stats (Client-side aggregation for now)
        // Note: For large scale, use RPC or optimized query.
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

        setStats({
          workouts: totalSessions,
          calories: Math.round(bmr),
          minutes: Math.round(totalMinutes),
        });

        // 2. Process Membership Data
        if (memberResponse.data?.plan) {
          const planName = (memberResponse.data.plan as any).name;
          // Map backend Plan Names to Translation Keys
          // Assuming DB names: "Standard Pack", "Silver Pack", "Gold Pack", "Platinum Pack"
          let translatedTier = t("home.tier.standard"); // Default

          if (planName.toLowerCase().includes("silver")) {
            translatedTier = t("home.tier.silver");
          } else if (planName.toLowerCase().includes("gold")) {
            translatedTier = t("home.tier.gold");
          } else if (planName.toLowerCase().includes("platinum")) {
            translatedTier = t("home.tier.platinum");
          } else {
            translatedTier = t("home.tier.standard");
          }

          setMemberTier(translatedTier);
        } else {
          setMemberTier(t("home.tier.standard"));
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchData();
  }, [user]);

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

  const MENU_ITEMS: { label: string; icon: string; action?: () => void }[] = [
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
    { label: t("profile.notifications"), icon: "bell" },
    { label: t("profile.privacy_policy"), icon: "shield" },
    { label: t("profile.settings"), icon: "cog" },
  ];

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Gymbro User";

  return (
    <ScrollView
      className="flex-1 bg-background"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="items-center pt-12 pb-8 bg-surface rounded-b-[30px] shadow-sm mb-6 border-b border-gray-800">
        <View className="mb-4 relative">
          <View className="w-24 h-24 rounded-full bg-gray-700 items-center justify-center border-4 border-surface overflow-hidden">
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
              <Text className="text-3xl font-bold text-gray-400">
                {user?.user_metadata?.full_name
                  ? user.user_metadata.full_name.charAt(0).toUpperCase()
                  : user?.email?.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          {/* Status Indicator (Optional) */}
          <View className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-surface" />
        </View>
        <Text className="text-white text-2xl font-bold mb-1">
          {displayName}
        </Text>
        <Text className="text-gray-500 text-sm">{user?.email}</Text>
        <Text className="text-primary font-bold text-xs mt-2 bg-orange-900/30 px-3 py-1 rounded-full uppercase tracking-wider">
          {memberTier}
        </Text>
      </View>

      {/* Stats */}
      <View className="px-6 mb-8 flex-row justify-between">
        {STATS.map((stat, index) => (
          <View
            key={index}
            className="bg-surface w-[30%] p-3 rounded-2xl items-center border border-gray-800"
          >
            <Text className="text-primary text-xl font-bold">{stat.value}</Text>
            <Text className="text-gray-400 text-xs mt-1">{stat.unit}</Text>
            <Text className="text-gray-500 text-[10px] mt-1 uppercase">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Menu Options */}
      <View className="px-6 mb-8">
        <Text className="text-white font-bold text-lg mb-4">
          {t("profile.general")}
        </Text>
        <View className="bg-surface rounded-2xl overflow-hidden border border-gray-800">
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={index}
              className={`flex-row items-center p-4 ${
                index !== MENU_ITEMS.length - 1
                  ? "border-b border-gray-800"
                  : ""
              }`}
              onPress={() => {
                if (item.action) {
                  item.action();
                } else {
                  Alert.alert(
                    "Feature coming soon",
                    "This feature is under development."
                  );
                }
              }}
            >
              <View className="w-8 h-8 bg-gray-900 rounded-full items-center justify-center mr-4">
                <FontAwesome
                  name={item.icon as any}
                  size={14}
                  color="#FFA500"
                />
              </View>
              <Text className="text-white flex-1 font-medium">
                {item.label}
              </Text>
              <FontAwesome name="angle-right" size={16} color="#4B5563" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logout Button */}
      <View className="px-6 pb-20">
        <TouchableOpacity
          className="w-full bg-surface border border-red-900/50 p-4 rounded-xl flex-row items-center justify-center"
          onPress={() => supabase.auth.signOut()}
        >
          <FontAwesome name="sign-out" size={18} color="#EF4444" />
          <Text className="text-red-500 font-bold ml-2">
            {t("profile.logout")}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
