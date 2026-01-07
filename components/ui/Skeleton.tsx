import { useThemeContext } from "@/lib/theme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/**
 * Skeleton Loading Component
 *
 * A reusable shimmer effect skeleton loader for React Native.
 * Uses react-native-reanimated for smooth 60fps animations.
 * Styled with NativeWind v4 className (semantic tokens).
 *
 * Features:
 * - Smooth shimmer animation (left to right, 1500ms duration)
 * - Dark mode support (uses semantic tokens)
 * - Configurable width, height, borderRadius
 * - Design system compliant (bg-muted for base)
 * - Optimized: Animation stops on unmount (Rule 15)
 *
 * @example
 * ```tsx
 * <Skeleton width="100%" height={20} borderRadius={4} />
 * <Skeleton width={50} height={50} borderRadius={25} />
 * ```
 */
interface SkeletonProps {
  /** Width of the skeleton (string for percentage, number for pixels) */
  width?: string | number;
  /** Height of the skeleton (string for percentage, number for pixels) */
  height?: string | number;
  /** Border radius for rounded corners */
  borderRadius?: number;
  /** Optional custom test ID for testing */
  testID?: string;
}

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 4,
  testID,
}: SkeletonProps) {
  const { colorScheme } = useThemeContext();

  // Animation state: shimmer translates from -100% to 100%
  const translateX = useSharedValue(-1);

  // Start shimmer animation on mount
  // Rule 15 Optimization: Clean up animation on unmount to save CPU cycles
  React.useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, {
        duration: 1500, // Per research: not too fast, not too slow
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // Infinite loop
      false
    );

    // Cleanup: Stop animation when component unmounts
    return () => {
      cancelAnimation(translateX);
      translateX.value = -1; // Reset to initial position
    };
  }, [translateX]);

  // Animated style for shimmer effect
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${translateX.value * 200}%` }],
  }));

  // Shimmer gradient colors based on color scheme
  // Light mode: transparent -> white/40% -> transparent
  // Dark mode: transparent -> white/15% -> transparent
  const shimmerColors: [string, string, string] =
    colorScheme === "dark"
      ? ["transparent", "rgba(255, 255, 255, 0.15)", "transparent"]
      : ["transparent", "rgba(255, 255, 255, 0.4)", "transparent"];

  // Calculate NativeWind classes for border radius
  const radiusClass =
    borderRadius === 0
      ? "rounded-none"
      : borderRadius === 9999
        ? "rounded-full"
        : ""; // Use inline style for custom values

  return (
    <View
      testID={testID}
      className={`bg-muted overflow-hidden relative ${radiusClass}`}
      style={{
        width: width as any,
        height: height as any,
        ...(borderRadius > 0 && borderRadius !== 9999 && { borderRadius }),
      }}
    >
      <Animated.View
        className="absolute top-0 left-0 right-0 bottom-0"
        style={[
          { width: "50%" }, // Shimmer covers 50% of skeleton width
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
