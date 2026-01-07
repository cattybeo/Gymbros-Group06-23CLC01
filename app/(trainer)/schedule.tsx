import Colors from "@/constants/Colors";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import dayjs from "dayjs";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrainerSchedule() {
  const { user } = useAuthContext();
  const { colorScheme } = useThemeContext();
  const { t } = useTranslation();
  const colors = Colors[colorScheme];
  const { showAlert, CustomAlertComponent } = useCustomAlert();

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"today" | "all">("today");

  const fetchSchedule = useCallback(async () => {
    if (!user) return;
    try {
      let query = supabase
        .from("classes")
        .select(`*, bookings:bookings(count)`)
        .eq("trainer_id", user.id)
        .order("start_time", { ascending: true });

      if (filter === "today") {
        const todayStart = dayjs().startOf("day").toISOString();
        const todayEnd = dayjs().endOf("day").toISOString();
        query = query.gte("start_time", todayStart).lte("start_time", todayEnd);
      }

      const { data, error } = await query;
      if (error) throw error;
      setClasses(data || []);
    } catch (e: any) {
      showAlert(t("common.error"), e.message || "Fetch failed", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, filter, t, showAlert]);

  useFocusEffect(
    useCallback(() => {
      fetchSchedule();
    }, [fetchSchedule])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule();
  };

  const handleClassPress = (classId: string) => {
    router.push(`/(trainer)/session/${classId}` as any);
  };

  const renderClassItem = ({ item }: { item: any }) => {
    const isFinished = dayjs().isAfter(dayjs(item.end_time));
    return (
      <TouchableOpacity
        style={[
          styles.classCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => handleClassPress(item.id)}
      >
        <View style={styles.timeSection}>
          <Text style={[styles.timeText, { color: colors.text }]}>
            {dayjs(item.start_time).format(t("trainer.schedule.time_format"))}
          </Text>
          <Text style={[styles.dateText, { color: colors.foreground_muted }]}>
            {dayjs(item.start_time).format(
              t("trainer.schedule.date_format_short")
            )}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.className, { color: colors.text }]}>
            {item.name}
          </Text>
          <View style={styles.detailsRow}>
            <FontAwesome
              name="group"
              size={12}
              color={colors.foreground_muted}
            />
            <Text
              style={[styles.detailsText, { color: colors.foreground_muted }]}
            >
              {item.bookings?.[0]?.count || 0} / {item.capacity}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isFinished
                ? colors.secondary
                : colors.primary_light,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: isFinished ? colors.foreground_muted : colors.primary },
            ]}
          >
            {isFinished
              ? t("trainer.schedule.status_finished")
              : t("trainer.schedule.status_upcoming")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <CustomAlertComponent />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("trainer.schedule.title")}
          </Text>

          <View style={styles.filterBar}>
            <TouchableOpacity
              onPress={() => setFilter("today")}
              style={[
                styles.filterBtn,
                filter === "today" && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.filterLabel,
                  {
                    color: filter === "today" ? colors.on_primary : colors.text,
                  },
                ]}
              >
                {t("trainer.schedule.filter_today")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilter("all")}
              style={[
                styles.filterBtn,
                filter === "all" && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.filterLabel,
                  { color: filter === "all" ? colors.on_primary : colors.text },
                ]}
              >
                {t("trainer.schedule.filter_all")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 40 }}
          />
        ) : (
          <FlatList
            data={classes}
            keyExtractor={(item) => item.id}
            renderItem={renderClassItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FontAwesome
                  name="calendar-times-o"
                  size={48}
                  color={colors.border}
                />
                <Text style={{ color: colors.foreground_muted, marginTop: 12 }}>
                  {t("trainer.schedule.no_classes")}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "bold" },
  filterBar: { flexDirection: "row", gap: 10, marginTop: 16 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  filterLabel: { fontWeight: "600" },

  listContent: { padding: 16, paddingBottom: 40 },
  classCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: "center",
  },
  timeSection: {
    width: 60,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.05)",
    marginRight: 16,
  },
  timeText: { fontSize: 18, fontWeight: "bold" },
  dateText: { fontSize: 12 },

  infoSection: { flex: 1 },
  className: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  detailsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailsText: { fontSize: 13 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: "bold" },

  emptyContainer: {
    paddingTop: 80,
    alignItems: "center",
    justifyContent: "center",
  },
});
