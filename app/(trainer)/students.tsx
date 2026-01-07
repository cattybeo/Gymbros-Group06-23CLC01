import Colors from "@/constants/Colors";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { useThemeContext } from "@/lib/theme";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import dayjs from "dayjs";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function TrainerStudents() {
  const { user } = useAuthContext();
  const { colorScheme } = useThemeContext();
  const { t } = useTranslation();
  const colors = Colors[colorScheme];
  const { showAlert, CustomAlertComponent } = useCustomAlert();

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStudents = useCallback(async () => {
    if (!user) return;
    try {
      // Use optimized RPC for high performance
      const { data, error } = await supabase.rpc("get_trainer_students", {
        p_trainer_id: user.id,
      });

      if (error) throw error;
      setStudents(data || []);
    } catch (e: any) {
      showAlert(t("common.error"), e.message || "Fetch failed", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, t, showAlert]);

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [fetchStudents])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  const filteredStudents = students.filter((s) =>
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStudentItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.studentCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.primary_light }]}>
        <Text
          style={{ color: colors.primary, fontWeight: "bold", fontSize: 18 }}
        >
          {item.full_name?.charAt(0) || t("common.unknown_name").charAt(0)}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>
          {item.full_name}
        </Text>
        <Text style={[styles.subtext, { color: colors.foreground_muted }]}>
          {t("trainer.students.total_bookings", { count: item.booking_count })}
        </Text>
        <Text style={[styles.subtext, { color: colors.foreground_muted }]}>
          {t("trainer.students.last_attended", {
            date: dayjs(item.last_booking).format(
              t("trainer.schedule.date_format_full")
            ),
          })}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn}>
          <FontAwesome name="comment-o" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <FontAwesome name="phone" size={20} color={colors.success} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <CustomAlertComponent />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("trainer.students.title")}
            </Text>

            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <FontAwesome
                name="search"
                size={16}
                color={colors.foreground_muted}
              />
              <TextInput
                placeholder={t("trainer.students.search_placeholder")}
                placeholderTextColor={colors.foreground_muted}
                style={[styles.searchInput, { color: colors.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
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
              data={filteredStudents}
              keyExtractor={(item) => item.id}
              renderItem={renderStudentItem}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={{ color: colors.foreground_muted }}>
                    {t("trainer.students.no_students")}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 16 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },

  listContent: { padding: 16, paddingBottom: 40 },
  studentCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  subtext: { fontSize: 12, marginTop: 2 },

  actions: { flexDirection: "row", gap: 12 },
  iconBtn: {
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 10,
  },

  emptyContainer: {
    paddingTop: 80,
    alignItems: "center",
  },
});
