import CrowdHeatmap from "@/components/CrowdHeatmap";
import { CatalogSkeleton } from "@/components/ui/CatalogSkeleton";
import { ClassCardSkeleton } from "@/components/ui/ClassCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import React from "react";
import { ScrollView, View } from "react-native";

export const ClassesSkeleton = () => {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="flex-1 mt-12"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="mb-4">
        <Skeleton width={200} height={36} borderRadius={4} />
        <View className="mt-2">
          <Skeleton width={150} height={16} borderRadius={4} />
        </View>
      </View>
      <CatalogSkeleton />
      <CrowdHeatmap isLoading={true} />
      <View className="mb-4">
        <Skeleton width={180} height={24} borderRadius={4} />
      </View>
      <ClassCardSkeleton />
      <ClassCardSkeleton />
    </ScrollView>
  );
};
