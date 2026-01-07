import ClassCard from "@/components/ClassCard";
import CrowdHeatmap from "@/components/CrowdHeatmap";
import { supabase } from "@/lib/supabase";
import { GymClass } from "@/lib/types";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Text, View } from "react-native";

interface LiveClassListProps {
  data: GymClass[];
  handleBook: (id: string, count: number) => void;
  bookingId: string | null;
  myBookings: Set<string>;
  renderCatalog: () => React.ReactNode;
  isLoading: boolean;
  onRefresh: () => void;
}

export const LiveClassList = ({
  data,
  handleBook,
  bookingId,
  myBookings,
  renderCatalog,
  isLoading,
  onRefresh,
}: LiveClassListProps) => {
  const [classCounts, setClassCounts] = useState<Record<string, number>>({});
  const { t } = useTranslation();

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

  const renderItem = ({ item }: { item: GymClass }) => {
    const bookedCount = classCounts[item.id] || 0;
    const isBooked = myBookings.has(item.id);
    const isFull = bookedCount >= item.capacity;
    const spotsLeft = item.capacity - bookedCount;

    return (
      <ClassCard
        gymClass={item}
        onBook={(id) => handleBook(id, bookedCount)}
        isBooking={bookingId === item.id}
        isBooked={isBooked}
        isFull={isFull}
        spotsLeft={spotsLeft}
      />
    );
  };

  return (
    <FlatList
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
        <Text className="text-center text-muted_foreground mt-10">
          {t("classes.empty_list")}
        </Text>
      }
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};
