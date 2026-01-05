import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

export interface TrafficData {
  day_of_week: number; // 0 = Sun, 1 = Mon...
  hour_of_day: number; // 0-23
  traffic_score: number; // 0.0 - 1.0
}

interface CrowdHeatmapProps {
  data: TrafficData[];
  isLoading?: boolean;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 22 PM (10 PM)
const DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon to Sun order

export default function CrowdHeatmap({ data, isLoading }: CrowdHeatmapProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  // Helper to get color based on score
  const getColor = (score: number) => {
    if (score === 0) return "bg-gray-800"; // Empty
    if (score < 0.3) return "bg-emerald-500"; // Low
    if (score < 0.7) return "bg-yellow-500"; // Med
    return "bg-red-500"; // High
  };

  const getIntensityLabel = (score: number) => {
    if (score < 0.3) return t("heatmap.low", { defaultValue: "Vắng" });
    if (score < 0.7) return t("heatmap.med", { defaultValue: "Vừa" });
    return t("heatmap.high", { defaultValue: "Đông" });
  };

  // Convert flat data to map for O(1) lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => {
      map.set(`${d.day_of_week}-${d.hour_of_day}`, d.traffic_score);
    });
    return map;
  }, [data]);

  const [selectedCell, setSelectedCell] = useState<{
    day: number;
    hour: number;
    score: number;
  } | null>(null);

  const renderCell = (day: number, hour: number) => {
    const key = `${day}-${hour}`;
    const score = dataMap.get(key) || 0;
    const colorClass = getColor(score);

    // Highlight border if selected
    const isSelected = selectedCell?.day === day && selectedCell?.hour === hour;
    const borderClass = isSelected
      ? "border-2 border-white"
      : "border border-transparent";

    return (
      <TouchableOpacity
        key={key}
        className={`w-8 h-8 m-0.5 rounded-md ${colorClass} ${borderClass}`}
        onPress={() => setSelectedCell({ day, hour, score })}
        activeOpacity={0.7}
      />
    );
  };

  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay();

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-2 px-1">
        <Text className="text-white text-lg font-bold flex-row items-center">
          <Ionicons name="bar-chart" size={20} color={colors.tint} />
          {"  "}
          {t("heatmap.title", { defaultValue: "Gym Traffic" })}
        </Text>
        {/* Simple Legend */}
        <View className="flex-row gap-2">
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-emerald-500 rounded-sm mr-1" />
            <Text className="text-gray-400 text-xs">{t("heatmap.low")}</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-yellow-500 rounded-sm mr-1" />
            <Text className="text-gray-400 text-xs">{t("heatmap.med")}</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-red-500 rounded-sm mr-1" />
            <Text className="text-gray-400 text-xs">{t("heatmap.high")}</Text>
          </View>
        </View>
      </View>

      <View className="bg-surface rounded-xl p-3 border border-gray-800">
        {/* Top Header: Current Status Prediction */}
        <View className="mb-4 flex-row items-center justify-between border-b border-gray-800 pb-2">
          <Text className="text-gray-300 font-medium">
            {t("heatmap.now", { defaultValue: "Live Status:" })}
          </Text>
          <Text className="text-primary font-bold">
            {/* Mock live status based on heatmap data for current hour */}
            {getIntensityLabel(
              dataMap.get(`${currentDay}-${currentHour}`) || 0
            )}
          </Text>
        </View>

        <View className="flex-row">
          {/* Y-Axis: Days */}
          <View className="mt-8 mr-2">
            {DAYS.map((day) => (
              <View key={day} className="h-8 m-0.5 justify-center">
                <Text className="text-gray-400 text-xs font-bold text-right w-8">
                  {t(`heatmap.days.${day}`, {
                    defaultValue: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][
                      day
                    ],
                  })}
                </Text>
              </View>
            ))}
          </View>

          {/* X-Axis: Hours (Scrollable) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Header Row: Hours */}
              <View className="flex-row mb-1">
                {HOURS.map((hour) => (
                  <View key={hour} className="w-8 m-0.5 items-center">
                    <Text className="text-gray-500 text-[10px]">{hour}h</Text>
                  </View>
                ))}
              </View>

              {/* Grid */}
              {DAYS.map((day) => (
                <View key={day} className="flex-row">
                  {HOURS.map((hour) => renderCell(day, hour))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Selected Prediction Text */}
        {selectedCell && (
          <View className="mt-3 bg-gray-900 p-2 rounded-lg items-center">
            <Text className="text-gray-300 text-xs text-center">
              {t(`heatmap.days.${selectedCell.day}`, {
                defaultValue: "Day " + selectedCell.day,
              })}{" "}
              @ {selectedCell.hour}:00 -
              <Text
                className={`font-bold ${selectedCell.score > 0.7 ? "text-red-400" : "text-emerald-400"}`}
              >
                {" "}
                {Math.round(selectedCell.score * 100)}%{" "}
                {t("heatmap.capacity", { defaultValue: "Capacity" })}
              </Text>
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
