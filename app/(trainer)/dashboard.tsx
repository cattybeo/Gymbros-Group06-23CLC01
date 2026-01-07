import Colors from "@/constants/Colors";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { getTrainerAIInsights } from "@/lib/ai";
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
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrainerDashboard() {
  const { user, profile } = useAuthContext();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];
  const { t } = useTranslation();
  const { showAlert, CustomAlertComponent } = useCustomAlert();

  const [nextClass, setNextClass] = useState<any>(null);
  const [stats, setStats] = useState({ studentCount: 0, hoursToday: 0 });
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingAI, setFetchingAI] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAIInsights = useCallback(async () => {
    if (!user || !profile) return;
    setFetchingAI(true);
    try {
      // Fetch recent finished classes
      const { data: pastClasses } = await supabase
        .from("classes")
        .select("id, name, start_time, end_time")
        .eq("trainer_id", user.id)
        .lte("end_time", new Date().toISOString())
        .order("end_time", { ascending: false })
        .limit(5);

      if (pastClasses && pastClasses.length > 0) {
        const classIds = pastClasses.map((c) => c.id);

        // Fetch attendance for these classes
        const { data: attendance } = await supabase
          .from("access_logs")
          .select("user_id, class_id, entered_at")
          .in("class_id", classIds);

        const insights = await getTrainerAIInsights(profile, {
          classSessions: pastClasses.map((c) => ({
            name: c.name,
            attendanceCount:
              attendance?.filter((a) => a.class_id === c.id).length || 0,
          })),
          studentAttendance:
            attendance?.map((a: any) => ({
              studentId: a.user_id,
              attended: true,
              date: a.entered_at,
            })) || [],
        });

        setAiInsights(insights);
      }
    } catch (e) {
      console.warn("AI Insights fetch failed:", e);
    } finally {
      setFetchingAI(false);
    }
  }, [user, profile]);

  const fetchDashboardData = useCallback(async () => {
    if (!user || !profile) return;
    try {
      const now = new Date().toISOString();
      const todayStart = dayjs().startOf("day").toISOString();
      const todayEnd = dayjs().endOf("day").toISOString();

      // 1. Fetch Next Upcoming Class
      const { data: nextClassData, error: classError } = await supabase
        .from("classes")
        .select(
          `
          *,
          bookings:bookings(count)
        `
        )
        .eq("trainer_id", user.id)
        .neq("status", "finished")
        .gte("end_time", now)
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (classError) throw classError;
      setNextClass(nextClassData);

      // 2. Fetch Today's Stats
      const { data: todayClasses, error: statsError } = await supabase
        .from("classes")
        .select(
          `
          id,
          start_time,
          end_time,
          bookings:bookings(count)
        `
        )
        .eq("trainer_id", user.id)
        .gte("start_time", todayStart)
        .lte("start_time", todayEnd);

      if (statsError) throw statsError;

      let totalStudents = 0;
      let totalMinutes = 0;

      todayClasses?.forEach((c: any) => {
        totalStudents += c.bookings?.[0]?.count || 0;
        const duration = dayjs(c.end_time).diff(dayjs(c.start_time), "minute");
        totalMinutes += duration;
      });

      setStats({
        studentCount: totalStudents,
        hoursToday: Math.round((totalMinutes / 60) * 10) / 10,
      });

      // 3. Fetch AI Insights (if not already fetched or on refresh)
      if (!aiInsights) {
        fetchAIInsights();
      }
    } catch (error: any) {
      showAlert(t("common.error"), error.message || "Fetch failed", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, profile, aiInsights, fetchAIInsights, t, showAlert]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleClassPress = (classId: string) => {
    router.push(`/(trainer)/session/${classId}` as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <CustomAlertComponent />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {t("trainer.dashboard.greeting", {
              name:
                profile?.full_name?.split(" ").pop() ||
                t("common.role_trainer"),
            })}
          </Text>
          <Text style={[styles.subtext, { color: colors.foreground_muted }]}>
            {dayjs().format(t("trainer.schedule.date_format_full"))}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {stats.studentCount}
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.foreground_muted }]}
            >
              {t("trainer.dashboard.students_today")}
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {stats.hoursToday}
              {t("common.unit_hour")}
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.foreground_muted }]}
            >
              {t("trainer.dashboard.teaching_hours")}
            </Text>
          </View>
        </View>

        {/* Next Class Card */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("trainer.dashboard.next_class")}
        </Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : nextClass ? (
          <TouchableOpacity
            style={[
              styles.nextClassCard,
              { backgroundColor: colors.card, borderColor: colors.primary },
            ]}
            onPress={() => handleClassPress(nextClass.id)}
          >
            <View style={styles.classHeader}>
              <Text style={[styles.className, { color: colors.text }]}>
                {nextClass.name}
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.primary_light },
                ]}
              >
                <Text style={{ color: colors.on_primary, fontWeight: "bold" }}>
                  {dayjs(nextClass.start_time).format(
                    t("trainer.schedule.time_format")
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.classInfoRow}>
              <FontAwesome
                name="map-marker"
                size={16}
                color={colors.foreground_muted}
                style={{ width: 20 }}
              />
              <Text style={{ color: colors.foreground_secondary }}>
                {t("trainer.dashboard.main_gym")}
              </Text>
            </View>

            <View style={styles.classInfoRow}>
              <FontAwesome
                name="group"
                size={16}
                color={colors.foreground_muted}
                style={{ width: 20 }}
              />
              <Text style={{ color: colors.foreground_secondary }}>
                {t("trainer.dashboard.student_count", {
                  count: nextClass.bookings?.[0]?.count || 0,
                  capacity: nextClass.capacity,
                })}
              </Text>
            </View>

            <View
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: colors.on_primary, fontWeight: "600" }}>
                {t("trainer.dashboard.action_attendance")}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View
            style={[styles.emptyState, { backgroundColor: colors.secondary }]}
          >
            <Text style={{ color: colors.foreground_secondary }}>
              {t("trainer.dashboard.no_upcoming_classes")}
            </Text>
          </View>
        )}

        {/* AI AI AI Section */}
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { marginTop: 0, color: colors.text },
              ]}
            >
              {t("trainer.ai_coach.title")}
            </Text>
            {fetchingAI && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          {aiInsights ? (
            <View
              style={[
                styles.aiCard,
                {
                  backgroundColor:
                    aiInsights.vibe_type === "warning"
                      ? colors.error + "08"
                      : colors.primary_light + "10",
                  borderColor:
                    aiInsights.vibe_type === "warning"
                      ? colors.error + "30"
                      : colors.primary + "30",
                },
              ]}
            >
              <View style={styles.aiRecapBox}>
                <Text style={[styles.aiRecapText, { color: colors.text }]}>
                  {aiInsights.recap.summary}
                </Text>
              </View>

              {aiInsights.retention_alerts?.length > 0 && (
                <View style={styles.alertContainer}>
                  <Text style={[styles.alertTitle, { color: colors.error }]}>
                    {t("trainer.ai_coach.retention_alert")}
                  </Text>
                  {aiInsights.retention_alerts.map((alert: any, i: number) => (
                    <View key={i} style={styles.alertItem}>
                      <Text style={[styles.alertText, { color: colors.text }]}>
                        • {alert.student_name}: {alert.reason}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {aiInsights.smart_broadcasts?.length > 0 && (
                <View style={styles.broadcastContainer}>
                  <Text
                    style={[styles.broadcastTitle, { color: colors.primary }]}
                  >
                    {t("trainer.ai_coach.smart_broadcast_draft")}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.broadcastCard,
                      { backgroundColor: colors.card },
                    ]}
                    onPress={() => {
                      /* Copy to clipboard or open chat */
                    }}
                  >
                    <Text
                      style={[styles.broadcastType, { color: colors.primary }]}
                    >
                      {aiInsights.smart_broadcasts[0].type === "motivational"
                        ? t("trainer.ai_coach.broadcast_type_motivational")
                        : aiInsights.smart_broadcasts[0].type === "urgent"
                          ? t("trainer.ai_coach.broadcast_type_urgent")
                          : t("trainer.ai_coach.broadcast_type_friendly")}
                    </Text>
                    <Text
                      style={[
                        styles.broadcastContent,
                        { color: colors.foreground_secondary },
                      ]}
                    >
                      {aiInsights.smart_broadcasts[0].message}
                    </Text>
                    <Text style={styles.copyHint}>
                      {t("trainer.ai_coach.copy_hint")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            !fetchingAI && (
              <TouchableOpacity
                style={styles.emptyAI}
                onPress={fetchAIInsights}
              >
                <Text style={{ color: colors.foreground_muted }}>
                  {t("trainer.ai_coach.empty_state")}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: "bold" },
  subtext: { fontSize: 16, marginTop: 4, textTransform: "capitalize" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 12,
  },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statValue: { fontSize: 24, fontWeight: "bold", marginBottom: 4 },
  statLabel: { fontSize: 12 },

  nextClassCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  className: { fontSize: 20, fontWeight: "bold", flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  classInfoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },

  actionButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: { padding: 30, alignItems: "center", borderRadius: 12 },

  // AI Assistant Styles
  aiSection: { marginTop: 8, marginBottom: 40 },
  aiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  aiCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  aiRecapBox: { marginBottom: 16 },
  aiRecapText: { fontSize: 15, lineHeight: 22, fontStyle: "italic" },
  alertContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    marginBottom: 16,
  },
  alertTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 8 },
  alertItem: { marginBottom: 4 },
  alertText: { fontSize: 13 },
  broadcastContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  broadcastTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 8 },
  broadcastCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  broadcastType: { fontSize: 12, fontWeight: "bold", marginBottom: 4 },
  broadcastContent: { fontSize: 13, lineHeight: 18 },
  copyHint: {
    fontSize: 10,
    color: "#999",
    textAlign: "right",
    marginTop: 8,
  },
  emptyAI: {
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ccc",
    borderRadius: 12,
  },
});
