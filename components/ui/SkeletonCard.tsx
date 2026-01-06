import React from "react";
import { View } from "react-native";
import { Skeleton } from "./Skeleton";

/**
 * Skeleton Card Component
 *
 * A reusable card skeleton wrapper with multiple shimmer bars.
 * Styled with NativeWind v4 className (semantic tokens).
 * Can be used for StatCard, MenuItem, and other card-based layouts.
 *
 * Features:
 * - Multiple shimmer bars (lines prop)
 * - Configurable spacing between lines
 * - Design system compliant (uses bg-card, border-border)
 * - Dark mode support
 *
 * @example
 * ```tsx
 * <SkeletonCard width="100%" height={80} lines={2} />
 * <SkeletonCard width={100} height={100} borderRadius={20} lines={3} />
 * ```
 */
interface SkeletonCardProps {
  /** Width of the card (string for percentage, number for pixels) */
  width?: string | number;
  /** Total height of the card */
  height?: number;
  /** Border radius for rounded corners */
  borderRadius?: number;
  /** Number of shimmer bars to display */
  lines?: number;
  /** Optional custom test ID for testing */
  testID?: string;
}

export function SkeletonCard({
  width = "100%",
  height = 80,
  borderRadius = 12,
  lines = 1,
  testID,
}: SkeletonCardProps) {
  // Calculate line height based on total height and number of lines
  // Reserve space for spacing between lines
  const spacing = 8; // spacing-sm between lines
  const totalSpacing = spacing * (lines - 1);
  const lineHeight = (height - totalSpacing) / lines;

  // Calculate NativeWind classes for border radius
  const radiusClass = borderRadius === 0
    ? "rounded-none"
    : borderRadius === 9999
    ? "rounded-full"
    : ""; // Use inline style for custom values

  return (
    <View
      testID={testID}
      className={`bg-card border border-border p-3 justify-center gap-2 ${radiusClass}`}
      style={{
        width: typeof width === "number" ? width : undefined,
        height,
        ...(borderRadius > 0 && borderRadius !== 9999 && { borderRadius }),
        ...(typeof width === "string" && { alignSelf: "stretch" }),
      }}
    >
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={`skeleton-line-${index}`}
          width="100%"
          height={lineHeight}
          borderRadius={4}
          testID={`${testID}-line-${index}`}
        />
      ))}
    </View>
  );
}
