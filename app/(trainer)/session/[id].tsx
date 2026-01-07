import Colors from "@/constants/Colors";
import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ClassSessionScreen() {
  const { id } = useLocalSearchParams();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];
  const { user } = useAuthContext();

  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchSessionDetails = useCallback(async () => {
    try {
      // 1. Fetch Class Info
      const { data: cData, error: cError } = await supabase
        .from("classes")
        .select("*")
        .eq("id", id)
        .single();

      if (cError) throw cError;
      setClassData(cData);

      // 2. Fetch Bookings (Students)
      // We join 'profiles' to get student names
      const { data: bData, error: bError } = await supabase
        .from("bookings")
        .select(
          `
          id,
          status,
          user_id,
          profiles:user_id (id, full_name, email, avatar_url)
        `
        )
        .eq("class_id", id);

      if (bError) throw bError;
      setStudents(bData || []);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchSessionDetails();
  }, [id, fetchSessionDetails]);

  const toggleAttendance = useCallback(
    async (bookingId: string, currentStatus: string) => {
      if (processingId) return;
      setProcessingId(bookingId);

      // Logic: Toggle between 'confirmed' (Registered) and 'attended' (Present)
      const isAttending = currentStatus !== "attended";
      const newStatus = isAttending ? "attended" : "confirmed";

      try {
        const updatePayload: any = { status: newStatus };

        const { error } = await supabase
          .from("bookings")
          .update(updatePayload)
          .eq("id", bookingId);

        if (error) throw error;

        // RECORD IN ACCESS_LOGS FOR AI COACH
        if (newStatus === "attended") {
          const student = students.find((s) => s.id === bookingId);
          if (student?.user_id) {
            await supabase.from("access_logs").insert({
              user_id: student.user_id,
              class_id: id,
              staff_id: user?.id,
              gate_location: "Class Session",
            });
          }
        } else {
          // If un-marking, we might want to delete the log,
          // but for simplicity we'll just leave it or handle it later.
        }

        // Optimistic Update
        setStudents((prev) =>
          prev.map((s) =>
            s.id === bookingId ? { ...s, status: newStatus } : s
          )
        );
      } catch (err: any) {
        Alert.alert("Update Failed", err.message);
      } finally {
        setProcessingId(null);
      }
    },
    [id, students, user, processingId]
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!classData) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: colors.text }}>Session not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header with Back Button */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <FontAwesome name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Quản lý lớp học
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.classSummary}>
        <Text style={[styles.className, { color: colors.primary }]}>
          {classData.name}
        </Text>
        <View style={styles.timeRow}>
          <FontAwesome
            name="clock-o"
            size={16}
            color={colors.foreground_muted}
          />
          <Text style={{ color: colors.foreground_secondary, marginLeft: 8 }}>
            {dayjs(classData.start_time).format("HH:mm")} -{" "}
            {dayjs(classData.end_time).format("HH:mm")}
          </Text>
        </View>
        <Text style={{ color: colors.foreground_muted, marginTop: 4 }}>
          {dayjs(classData.start_time).format("dddd, D MMMM YYYY")}
        </Text>
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Danh sách học viên ({students.length})
        </Text>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => {
          const isPresent = item.status === "attended";
          return (
            <View
              style={[
                styles.studentCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.studentInfo}>
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.primary_light },
                  ]}
                >
                  <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                    {item.profiles?.full_name?.charAt(0) || "S"}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.studentName, { color: colors.text }]}>
                    {item.profiles?.full_name || "Unknown User"}
                  </Text>
                  <Text
                    style={[
                      styles.studentEmail,
                      { color: colors.foreground_muted },
                    ]}
                  >
                    {item.profiles?.email}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => toggleAttendance(item.id, item.status)}
                disabled={processingId === item.id}
                style={[
                  styles.checkButton,
                  isPresent
                    ? {
                        backgroundColor: colors.success,
                        borderColor: colors.success,
                      }
                    : {
                        backgroundColor: "transparent",
                        borderColor: colors.foreground_muted,
                      },
                ]}
              >
                {processingId === item.id ? (
                  <ActivityIndicator
                    size="small"
                    color={isPresent ? "#fff" : colors.text}
                  />
                ) : (
                  <FontAwesome
                    name="check"
                    size={16}
                    color={isPresent ? "#fff" : colors.foreground_muted}
                  />
                )}
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text
            style={{
              textAlign: "center",
              color: colors.foreground_muted,
              marginTop: 40,
            }}
          >
            Chưa có học viên nào đăng ký.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: "bold" },

  classSummary: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 12,
  },
  className: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  timeRow: { flexDirection: "row", alignItems: "center" },

  listHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600" },

  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  studentInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  studentName: { fontWeight: "600", fontSize: 16 },
  studentEmail: { fontSize: 12 },

  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
