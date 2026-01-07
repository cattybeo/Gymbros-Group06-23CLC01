import React from "react";
import { ScrollView, View } from "react-native";
import { Skeleton } from "./Skeleton";

/**
 * CatalogSkeleton
 *
 * Matches the "Explore" horizontal scroll filter in classes.tsx.
 */
export function CatalogSkeleton() {
  return (
    <View className="mb-6">
      <View className="mb-3 px-1">
        <Skeleton width={120} height={24} borderRadius={4} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row">
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} className="mr-3 items-center">
              <Skeleton
                width={64} // w-16 = 64px
                height={64} // h-16 = 64px
                borderRadius={32}
              />
              <View className="mt-2">
                <Skeleton width={48} height={12} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
