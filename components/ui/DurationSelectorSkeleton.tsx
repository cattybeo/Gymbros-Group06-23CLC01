import React from "react";
import { View } from "react-native";
import { Skeleton } from "./Skeleton";

/**
 * DurationSelectorSkeleton
 *
 * Matches the filter/duration bar in membership.tsx.
 */
export function DurationSelectorSkeleton() {
  return (
    <View className="mb-6">
      <View className="flex-row bg-card p-1 rounded-3xl border border-border justify-between relative shadow-sm">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="flex-1 px-1">
            <Skeleton
              height={44} // py-3 + text height approx 44px
              borderRadius={16} // rounded-2xl
              testID={`duration-item-skeleton-${i}`}
            />
          </View>
        ))}
      </View>
      <View className="items-center mt-3">
        <Skeleton width={150} height={12} borderRadius={4} />
      </View>
    </View>
  );
}
