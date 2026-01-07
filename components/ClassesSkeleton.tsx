import CrowdHeatmap from "@/components/CrowdHeatmap";
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
      {/* Search Bar Skeleton */}
      <View className="flex-row items-center bg-card border border-border rounded-token-lg px-3 py-2 mb-4">
        <Skeleton width={20} height={20} borderRadius={10} />
        <View className="ml-2 flex-1">
          <Skeleton width="60%" height={16} borderRadius={4} />
        </View>
      </View>

      {/* Title Skeleton */}
      <View className="mb-4">
        <Skeleton width={180} height={36} borderRadius={4} />
      </View>

      {/* AI Advisor Card Skeleton */}
      <View className="bg-card p-4 rounded-3xl border border-border mb-4 overflow-hidden">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View className="mr-3">
              <Skeleton width={40} height={40} borderRadius={20} />
            </View>
            <View>
              <Skeleton width={100} height={18} borderRadius={4} />
              <View className="mt-1">
                <Skeleton width={140} height={12} borderRadius={4} />
              </View>
            </View>
          </View>
          <Skeleton width={80} height={24} borderRadius={12} />
        </View>
        <View className="space-y-2">
          <Skeleton width="100%" height={14} borderRadius={4} />
          <Skeleton width="90%" height={14} borderRadius={4} />
          <Skeleton width="40%" height={14} borderRadius={4} />
        </View>
      </View>

      <CrowdHeatmap isLoading={true} />

      {/* Upcoming title */}
      <View className="mb-4 mt-6">
        <Skeleton width={200} height={24} borderRadius={4} />
      </View>

      <ClassCardSkeleton />
      <ClassCardSkeleton />
      <ClassCardSkeleton />
    </ScrollView>
  );
};
