import React from "react";
import { View } from "react-native";
import { Skeleton } from "./Skeleton";

/**
 * ClassCardSkeleton
 *
 * Matches ClassCard.tsx 1:1 in layout and dimensions.
 */
export function ClassCardSkeleton() {
  return (
    <View className="bg-card p-4 rounded-2xl shadow-sm mb-4 border border-border overflow-hidden">
      <View className="flex-row mb-4">
        {/* Image Placeholder */}
        <Skeleton
          width={96} // w-24 = 96px
          height={96} // h-24 = 96px
          borderRadius={12} // rounded-xl
          testID="class-card-image-skeleton"
        />

        <View className="flex-1 ml-4 justify-between">
          <View>
            {/* Title Line */}
            <Skeleton width="80%" height={22} borderRadius={4} />

            {/* Date Line */}
            <View className="mt-2">
              <Skeleton width="50%" height={14} borderRadius={4} />
            </View>

            {/* Time Line */}
            <View className="mt-1">
              <Skeleton width="40%" height={14} borderRadius={4} />
            </View>
          </View>

          {/* Slots & Status Badges */}
          <View className="flex-row items-center mt-2">
            <Skeleton width={80} height={24} borderRadius={6} />
            <View className="ml-2">
              <Skeleton width={60} height={14} borderRadius={4} />
            </View>
          </View>
        </View>
      </View>

      {/* Description Line */}
      <View className="mb-4">
        <Skeleton width="100%" height={14} borderRadius={4} />
        <View className="mt-1">
          <Skeleton width="60%" height={14} borderRadius={4} />
        </View>
      </View>

      {/* Button Placeholder */}
      <Skeleton
        width="100%"
        height={48} // py-3 approx 48px
        borderRadius={12} // rounded-xl
        testID="class-card-button-skeleton"
      />
    </View>
  );
}
