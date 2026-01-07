import { AISuggestionCard } from "@/components/AISuggestionCard";
import ClassCard from "@/components/ClassCard";
import CrowdHeatmap from "@/components/CrowdHeatmap";
import Colors from "@/constants/Colors";
import { AISuggestion } from "@/lib/ai";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import { GymClass } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

interface LiveClassListProps {
  data: GymClass[];
  handleBook: (id: string, count: number) => void;
  bookingId: string | null;
  myBookings: Set<string>;
  renderCatalog: () => React.ReactNode;
  isLoading: boolean;
  onRefresh: () => void;
  aiSuggestion?: AISuggestion | null;
  aiLoading?: boolean;
  allClasses?: GymClass[];
  onResetFilters?: () => void;
}

export const LiveClassList = ({
  data,
  handleBook,
  bookingId,
  myBookings,
  renderCatalog,
  isLoading,
  onRefresh,
  aiSuggestion,
  aiLoading,
  allClasses = [],
  onResetFilters,
}: LiveClassListProps) => {
  const { t } = useTranslation();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});
  const listRef = useRef<FlatList>(null);
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

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
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
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

  const renderItem = ({ item }: { item: GymClass }) => {
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
          isBooking={bookingId === item.id}
          isBooked={isBooked}
          isFull={isFull}
          spotsLeft={spotsLeft}
          isAIRecommended={IsAiRecommended}
        />
      </View>
    );
  };

  return (
    <FlatList
      ref={listRef}
      data={data}
      keyExtractor={(item) => item.id}
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={5}
      removeClippedSubviews={true}
      ListHeaderComponent={
        <>
          <View className="mb-2">
            <Text className="text-3xl font-bold text-foreground">
              {t("classes.title")}
            </Text>
            <Text className="text-muted_foreground mt-1">
              {t("classes.subtitle")}
            </Text>
          </View>
          {renderCatalog()}
          {(aiSuggestion || aiLoading) && (
            <AISuggestionCard
              suggestion={aiSuggestion!}
              isLoading={aiLoading}
              allClasses={allClasses}
              onPressClass={scrollToClass}
            />
          )}
          <CrowdHeatmap isLoading={isLoading} />
          <Text className="text-lg font-bold text-foreground mb-2 mt-2 px-1">
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
            {t("classes.no_classes_title", {
              defaultValue: "No classes found",
            })}
          </Text>
          <Text className="text-muted_foreground text-center mt-2">
            {t("classes.empty_list")}
          </Text>
          <TouchableOpacity
            onPress={onResetFilters}
            className="mt-6 bg-secondary px-6 py-2 rounded-full"
          >
            <Text className="text-on-secondary font-bold">
              {t("common.reset_filters", { defaultValue: "Reset Filters" })}
            </Text>
          </TouchableOpacity>
        </View>
      }
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};
