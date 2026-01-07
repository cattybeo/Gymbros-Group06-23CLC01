import { AISuggestionCard } from "@/components/AISuggestionCard";
import ClassCard from "@/components/ClassCard";
import CrowdHeatmap, { TrafficData } from "@/components/CrowdHeatmap";
import Colors from "@/constants/Colors";
import { AISuggestion } from "@/lib/ai";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import { GymClass } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface LiveClassListProps {
  data: GymClass[];
  handleBook: (id: string, count: number) => void;
  handleCancel?: (id: string) => void;
  bookingId: string | null;
  myBookings: Set<string>;
  isLoading: boolean;
  onRefresh: () => void;
  aiSuggestion?: AISuggestion | null;
  aiLoading?: boolean;
  allClasses?: GymClass[];
  onResetFilters?: () => void;
  trafficData?: TrafficData[];
}

export const LiveClassList = ({
  data,
  handleBook,
  handleCancel,
  bookingId,
  myBookings,
  isLoading,
  onRefresh,
  aiSuggestion,
  aiLoading,
  allClasses = [],
  onResetFilters,
  trafficData,
}: LiveClassListProps) => {
  const { t } = useTranslation();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});
  const listRef = useRef<FlatList>(null);
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  // Scroll to Top FAB State
  const scrollY = useSharedValue(0);
  const fabOpacity = useSharedValue(0);
  const fabScale = useSharedValue(0);

  const fetchCounts = useCallback(async () => {
    if (data.length === 0) return;
    const { data: countsData } = await supabase.rpc("get_class_counts", {
      class_ids: data.map((c) => c.id),
    });

    if (countsData) {
      const counts: Record<string, number> = {};
      countsData.forEach((item: { class_id: string; count: number }) => {
        counts[item.class_id] = Number(item.count);
      });
      setClassCounts(counts);
    }
  }, [data]);

  useEffect(() => {
    fetchCounts();

    // Subscribe to Realtime Bookings for Instant Demo Updates
    const channel = supabase
      .channel("class_counts_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCounts]);

  // Handle pending scroll after filters reset
  useEffect(() => {
    if (pendingScrollId) {
      const index = data.findIndex((item) => item.id === pendingScrollId);
      if (index !== -1) {
        setTimeout(() => {
          listRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
          setPendingScrollId(null);
        }, 100);
      }
    }
  }, [data, pendingScrollId]);

  const scrollToClass = (classId: string) => {
    const index = data.findIndex((item) => item.id === classId);
    if (index !== -1) {
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    } else {
      // Not in filtered list, reset filters and queue scroll
      onResetFilters?.();
      setPendingScrollId(classId);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.y;
    scrollY.value = offset;

    if (offset > 400) {
      fabOpacity.value = withTiming(1);
      fabScale.value = withSpring(1);
    } else {
      fabOpacity.value = withTiming(0);
      fabScale.value = withSpring(0);
    }
  };

  const fabStyle = useAnimatedStyle(() => ({
    opacity: fabOpacity.value,
    transform: [{ scale: fabScale.value }],
  }));

  const renderItem = useCallback(
    ({ item }: { item: GymClass }) => {
      const bookedCount = classCounts[item.id] || 0;
      const isBooked = myBookings.has(item.id);
      const isFull = bookedCount >= item.capacity;
      const spotsLeft = item.capacity - bookedCount;
      const IsAiRecommended = aiSuggestion?.recommended_class_ids.includes(
        item.id
      );

      return (
        <View style={IsAiRecommended ? { transform: [{ scale: 1.02 }] } : null}>
          <ClassCard
            gymClass={item}
            onBook={(id) => handleBook(id, bookedCount)}
            onCancel={handleCancel}
            isBooking={bookingId === item.id}
            isBooked={isBooked}
            isFull={isFull}
            spotsLeft={spotsLeft}
            isAIRecommended={IsAiRecommended}
          />
        </View>
      );
    },
    [classCounts, myBookings, aiSuggestion, bookingId, handleBook, handleCancel]
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item) => item.id}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={10}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={Platform.OS === "android"}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.5,
            });
          });
        }}
        ListHeaderComponent={
          <>
            <View className="mb-4">
              <Text className="text-3xl font-bold text-foreground">
                {t("classes.title")}
              </Text>
            </View>

            {(aiSuggestion || aiLoading) && (
              <AISuggestionCard
                suggestion={aiSuggestion!}
                isLoading={aiLoading}
                allClasses={allClasses}
                onPressClass={scrollToClass}
              />
            )}
            <CrowdHeatmap isLoading={isLoading} initialData={trafficData} />
            <Text className="text-lg font-bold text-foreground mb-2 mt-4 px-1">
              {t("classes.upcoming_schedule")}
            </Text>
          </>
        }
        renderItem={renderItem}
        refreshing={isLoading}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View className="items-center justify-center py-20 px-10">
            <View className="bg-muted w-16 h-16 rounded-full items-center justify-center mb-4">
              <Ionicons
                name="search"
                size={32}
                color={colors.foreground_secondary}
              />
            </View>
            <Text className="text-xl font-bold text-foreground text-center">
              {t("classes.no_classes_title")}
            </Text>
            <Text className="text-muted_foreground text-center mt-2">
              {t("classes.empty_list")}
            </Text>
            <TouchableOpacity
              onPress={onResetFilters}
              className="mt-6 bg-secondary px-6 py-2 rounded-full"
            >
              <Text className="text-on-secondary font-bold">
                {t("common.reset_filters")}
              </Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 4 }}
        className="overflow-visible"
      />

      {/* Floating Scroll to Top Button */}
      <Animated.View
        style={[
          fabStyle,
          {
            position: "absolute",
            bottom: 20,
            right: 20,
            zIndex: 99,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() =>
            listRef.current?.scrollToOffset({ offset: 0, animated: true })
          }
          className="w-12 h-12 bg-primary rounded-full items-center justify-center shadow-lg border border-white/20"
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};
