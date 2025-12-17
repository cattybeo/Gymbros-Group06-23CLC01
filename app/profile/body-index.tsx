import { supabase } from "@/lib/supabase";
import { BodyIndex } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Screen for viewing body index history
export default function BodyIndexHistoryScreen() {
  const [data, setData] = useState<BodyIndex[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: records, error } = await supabase
        .from("body_indices")
        .select("*")
        .eq("user_id", user.id)
        .order("record_day", { ascending: false });

      if (error) throw error;
      setData((records as BodyIndex[]) || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const calculateBMI = (weight: number, height: number) => {
    // height is in cm
    const hM = height / 100;
    return (weight / (hM * hM)).toFixed(1);
  };

  const renderItem = ({ item }: { item: BodyIndex }) => {
    const bmi = calculateBMI(item.weight, item.height);
    return (
      <View className="bg-surface p-4 rounded-xl mb-3 border border-gray-700 flex-row justify-between items-center">
        <View>
          <Text className="text-gray-400 text-xs mb-1">
            {new Date(item.record_day).toLocaleDateString()}
          </Text>
          <View className="flex-row gap-4">
            <Text className="text-white font-bold text-lg">
              {item.weight} kg
            </Text>
            <Text className="text-white font-bold text-lg">
              {item.height} cm
            </Text>
          </View>
        </View>
        <View className="items-end bg-gray-800 px-3 py-1 rounded-lg">
          <Text className="text-xs text-gray-400">BMI</Text>
          <Text className="text-primary font-bold">{bmi}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background px-4"
      edges={["top", "bottom"]}
    >
      <View className="flex-row items-center mb-6 pt-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center bg-surface rounded-full mr-4"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold flex-1">
          {t("profile.body_index_history")}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/profile/add-body-index")}
          className="bg-primary px-3 py-2 rounded-lg"
        >
          <Text className="text-black font-bold text-xs">
            + {t("common.add")}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#C1FA6B" className="mt-10" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id || item.record_day}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text className="text-gray-500 text-center mt-10">
              {t("profile.no_records")}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
