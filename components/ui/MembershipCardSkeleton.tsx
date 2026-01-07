import React from "react";
import { View } from "react-native";
import { Skeleton } from "./Skeleton";

/**
 * MembershipCardSkeleton
 *
 * Matches MembershipCard.tsx 1:1 in layout and dimensions.
 */
export function MembershipCardSkeleton() {
  return (
    <View className="bg-card p-4 rounded-3xl shadow-sm mb-6 border border-border overflow-hidden">
      {/* Image Placeholder */}
      <Skeleton
        height={192} // h-48 = 192px
        borderRadius={16} // rounded-2xl
        testID="membership-card-image-skeleton"
      />

      {/* Price Section Placeholder */}
      <View className="px-2 mt-4 mb-4">
        <Skeleton
          width="60%"
          height={32}
          borderRadius={4}
          testID="membership-card-price-skeleton"
        />
        <View className="mt-2">
          <Skeleton width="40%" height={16} borderRadius={4} />
        </View>
      </View>

      {/* Features List Placeholder */}
      <View className="mb-6 px-2 space-y-3">
        {[1, 2, 3].map((i) => (
          <View key={i} className="flex-row items-center">
            <Skeleton width={18} height={18} borderRadius={9} />
            <View className="ml-3 flex-1">
              <Skeleton width="80%" height={14} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>

      {/* Button Placeholder */}
      <Skeleton
        width="100%"
        height={56} // py-4 approx 56px total height
        borderRadius={16} // rounded-2xl
        testID="membership-card-button-skeleton"
      />
    </View>
  );
}
