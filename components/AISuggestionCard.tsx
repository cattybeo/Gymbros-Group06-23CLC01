import Colors from "@/constants/Colors";
import { AISuggestion } from "@/lib/ai";
import { useThemeContext } from "@/lib/theme";
import { GymClass } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Skeleton } from "./ui/Skeleton";

interface AISuggestionCardProps {
  suggestion: AISuggestion;
  allClasses?: GymClass[];
  onPressClass?: (classId: string) => void;
  isLoading?: boolean;
}

export const AISuggestionCard = ({
  suggestion,
  allClasses = [],
  onPressClass,
  isLoading,
}: AISuggestionCardProps) => {
  const { t } = useTranslation();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];

  // AI Vibe Animations
  const borderOpacity = useSharedValue(0.3);
  const iconScale = useSharedValue(1);

  useEffect(() => {
    // Pulse border effect
    borderOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      true
    );

    // Subtle icon "thinking" or "glow" effect
    iconScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  if (isLoading) {
    return (
      <View className="mb-6 rounded-token-xl overflow-hidden bg-card border border-border p-4 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Skeleton width={24} height={24} borderRadius={12} />
            <View className="ml-2">
              <Skeleton width={80} height={12} borderRadius={4} />
            </View>
          </View>
          <View className="flex-row gap-1">
            <Skeleton width={40} height={16} borderRadius={4} />
            <Skeleton width={40} height={16} borderRadius={4} />
          </View>
        </View>
        <Skeleton width="100%" height={24} borderRadius={6} />
        <View className="mt-2">
          <Skeleton width="90%" height={16} borderRadius={4} />
          <View className="mt-1">
            <Skeleton width="75%" height={16} borderRadius={4} />
          </View>
        </View>
        <View className="mt-4 gap-2">
          <Skeleton width="100%" height={40} borderRadius={8} />
          <Skeleton width="100%" height={40} borderRadius={8} />
        </View>
      </View>
    );
  }

  // Map vibe type to colors
  const getVibeColors = (): readonly [string, string, ...string[]] => {
    switch (suggestion.vibe_type) {
      case "power":
        return [colors.primary, colors.accent] as const;
      case "focus":
        return ["#4F46E5", "#06B6D4"] as const; // Indigo to Cyan
      case "calm":
        return ["#10B981", "#3B82F6"] as const; // Emerald to Blue
      default:
        return [colors.accent, colors.primary_light] as const;
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(600)}
      className="mb-6 rounded-token-xl overflow-hidden bg-card border border-border shadow-md"
    >
      {/* Animated Glowing Border */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderWidth: 2,
            borderRadius: 22,
            borderColor: colors.accent,
          },
          animatedBorderStyle,
        ]}
      />

      <LinearGradient
        colors={getVibeColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          opacity: 0.08,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      <View className="p-4">
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            <Animated.View style={animatedIconStyle}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
            </Animated.View>
            <Text className="text-primary font-bold ml-2 uppercase tracking-widest text-xs">
              {t("classes.ai_advisor")}
            </Text>
          </View>
          <View className="flex-row gap-1">
            {suggestion.smart_tags.map((tag, idx) => (
              <View
                key={idx}
                className="bg-primary/10 px-2 py-0.5 rounded-token-sm"
              >
                <Text className="text-primary text-[10px] font-bold">
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text className="text-foreground text-lg font-bold mb-1">
          {suggestion.headline}
        </Text>

        <Text className="text-foreground-secondary text-sm leading-5">
          {suggestion.reasoning}
        </Text>

        {suggestion.recommended_class_ids &&
          suggestion.recommended_class_ids.length > 0 && (
            <View className="mt-4 gap-2">
              {suggestion.recommended_class_ids.map((id) => {
                const targetClass = allClasses.find((c) => c.id === id);
                if (!targetClass) return null;

                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => onPressClass?.(id)}
                    className="flex-row items-center bg-primary/20 border border-primary/30 px-3 py-2 rounded-token-md shadow-sm"
                  >
                    <View className="bg-primary rounded-full p-1 mr-3">
                      <Ionicons
                        name="fitness"
                        size={14}
                        color={colors.on_primary}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-foreground font-bold text-xs"
                        numberOfLines={1}
                      >
                        {targetClass.name}
                      </Text>
                      <Text className="text-foreground-secondary text-[10px]">
                        {new Date(targetClass.start_time).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
      </View>
    </Animated.View>
  );
};
