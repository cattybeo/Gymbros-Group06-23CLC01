import Colors from "@/constants/Colors";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Skeleton } from "./ui/Skeleton";

export interface TrafficData {
  day_of_week: number; // 0 = Sun, 1 = Mon...
  hour_of_day: number; // 0-23
  traffic_score: number; // 0.0 - 1.0
}

interface CrowdHeatmapProps {
  isLoading?: boolean;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 22 PM (10 PM)
const DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon to Sun order

export default function CrowdHeatmap({
  isLoading: parentLoading,
}: CrowdHeatmapProps) {
  const { t } = useTranslation();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  const [data, setData] = useState<TrafficData[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);

  const fetchTraffic = async () => {
    try {
      const { data: trafficData, error } =
        await supabase.rpc("get_weekly_traffic");
      if (!error && trafficData) {
        setData(trafficData);
      }
    } finally {
      setInternalLoading(false);
    }
  };

  useEffect(() => {
    fetchTraffic();
    const interval = setInterval(fetchTraffic, 30000); // 2026 BP: Isolated Polling
    return () => clearInterval(interval);
  }, []);

  const isLoading = parentLoading || internalLoading;

  // Pulse effect for the current hour cell (High-end UI feel)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Helper to get color based on score (2025-2026 Modern Spectrum)
  const getColor = (score: number) => {
    if (score === 0) return "bg-surface_highlight"; // Empty
    if (score < 0.2) return "bg-success/60"; // Very Low
    if (score < 0.45) return "bg-success"; // Low
    if (score < 0.65) return "bg-warning"; // Moderate
    if (score < 0.85) return "bg-error/80"; // Busy
    return "bg-error"; // Peak
  };

  const getIntensityLabel = (score: number) => {
    if (score < 0.3) return t("heatmap.low");
    if (score < 0.7) return t("heatmap.med");
    return t("heatmap.high");
  };

  // Convert flat data to map for O(1) lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => {
      map.set(`${d.day_of_week}-${d.hour_of_day}`, d.traffic_score);
    });
    return map;
  }, [data]);

  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay();

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
      ? "border-2 border-primary"
      : "border border-transparent";

    const isCurrentTime = day === currentDay && hour === currentHour;

    return (
      <TouchableOpacity
        key={key}
        onPress={() => setSelectedCell({ day, hour, score })}
        activeOpacity={0.7}
      >
        <Animated.View
          className={`w-8 h-8 m-0.5 rounded-md ${colorClass} ${borderClass}`}
          style={
            isCurrentTime
              ? { opacity: pulseAnim, transform: [{ scale: pulseAnim }] }
              : {}
          }
        />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="mb-6">
        <View className="mb-2 px-1">
          <Skeleton width={150} height={24} borderRadius={4} />
        </View>
        <View className="bg-surface rounded-xl p-3 border border-border">
          <View className="mb-4 border-b border-border pb-2">
            <Skeleton width="100%" height={20} borderRadius={4} />
          </View>
          <View className="flex-row">
            <View className="mt-8 mr-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <View key={i} className="h-8 m-0.5 justify-center">
                  <Skeleton width={32} height={12} borderRadius={4} />
                </View>
              ))}
            </View>
            <View className="flex-1">
              <View className="flex-row mb-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <View key={i} className="w-8 m-0.5 items-center">
                    <Skeleton width={20} height={10} borderRadius={2} />
                  </View>
                ))}
              </View>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} className="flex-row">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                    <View
                      key={j}
                      className="w-8 h-8 m-0.5 rounded-md bg-surface_highlight"
                    >
                      <Skeleton width="100%" height="100%" borderRadius={6} />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-2 px-1">
        <Text className="text-foreground text-lg font-bold flex-row items-center">
          <Ionicons name="bar-chart" size={20} color={colors.tint} />
          {"  "}
          {t("heatmap.title")}
        </Text>
        {/* Simple Legend */}
        <View className="flex-row gap-2">
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-success rounded-sm mr-1" />
            <Text className="text-foreground-secondary text-xs">
              {t("heatmap.low")}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-warning rounded-sm mr-1" />
            <Text className="text-foreground-secondary text-xs">
              {t("heatmap.med")}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-error rounded-sm mr-1" />
            <Text className="text-foreground-secondary text-xs">
              {t("heatmap.high")}
            </Text>
          </View>
        </View>
      </View>

      <View className="bg-surface rounded-xl p-3 border border-border">
        {/* Top Header: Current Status Prediction */}
        <View className="mb-4 flex-row items-center justify-between border-b border-border pb-2">
          <Text className="text-foreground-secondary font-medium">
            {t("heatmap.now")}
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
                <Text className="text-foreground-secondary text-xs font-bold text-right w-8">
                  {t(`heatmap.days.${day}`)}
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
                    <Text className="text-foreground-muted text-[10px]">
                      {hour}h
                    </Text>
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
          <View className="mt-3 bg-surface_highlight p-2 rounded-lg items-center border border-border">
            <Text className="text-foreground-secondary text-xs text-center">
              {t(`heatmap.days.${selectedCell.day}`)} @ {selectedCell.hour}:00 -
              <Text
                className={`font-bold ${selectedCell.score > 0.7 ? "text-error" : "text-success"}`}
              >
                {" "}
                {Math.round(selectedCell.score * 100)}% {t("heatmap.capacity")}
              </Text>
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
