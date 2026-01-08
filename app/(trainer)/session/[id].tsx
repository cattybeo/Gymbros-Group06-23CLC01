import Button from "@/components/ui/Button";
import Colors from "@/constants/Colors";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { useAuthContext } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import dayjs from "dayjs";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ClassSessionScreen() {
  const { id } = useLocalSearchParams();
  const { colorScheme } = useThemeContext();
  const { t } = useTranslation();
  const colors = Colors[colorScheme];
  const { user } = useAuthContext();
  const [permission, requestPermission] = useCameraPermissions();
  const { showAlert, CustomAlertComponent } = useCustomAlert();

  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingQR, setIsProcessingQR] = useState(false);

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
      // EXCLUDE HEATMAP BOT from student roster
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
        .eq("class_id", id)
        .neq("profiles.email", "heatmap_bot@gymbros.io");

      if (bError) throw bError;
      setStudents(bData || []);
    } catch (err: any) {
      showAlert(t("common.error"), t("trainer.session.error_load"), "error");
    } finally {
      setLoading(false);
    }
  }, [id, t, showAlert]);

  useEffect(() => {
    if (id) fetchSessionDetails();
  }, [id, fetchSessionDetails]);

  const toggleAttendance = useCallback(
    async (bookingId: string, currentStatus: string) => {
      if (processingId) return;
      setProcessingId(bookingId);

      try {
        // Trainer "Check-out" marks as completed.
        // We can toggle between 'completed' and 'arrived' (the status set by Staff)
        const newStatus =
          currentStatus === "completed" ? "arrived" : "completed";

        const { error } = await supabase
          .from("bookings")
          .update({
            status: newStatus,
            checkout_at:
              newStatus === "completed" ? new Date().toISOString() : null,
          })
          .eq("id", bookingId);

        if (error) throw error;

        // Update local state
        setStudents((prev) =>
          prev.map((s) =>
            s.id === bookingId ? { ...s, status: newStatus } : s
          )
        );
      } catch (err: any) {
        showAlert(
          t("common.error"),
          t("trainer.session.update_failed"),
          "error"
        );
      } finally {
        setProcessingId(null);
      }
    },
    [processingId, t, showAlert]
  );

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (isProcessingQR) return;
    setIsProcessingQR(true);

    try {
      // data is student's user_id from their dashboard QR
      const studentBooking = students.find((s) => s.user_id === data);
      if (studentBooking) {
        if (studentBooking.status !== "completed") {
          await toggleAttendance(studentBooking.id, studentBooking.status);
          showAlert(
            t("common.success"),
            t("trainer.session.scan_success", {
              name: studentBooking.profiles?.full_name || studentBooking.id,
            }),
            "success"
          );
          setIsScanning(false);
        } else {
          showAlert(
            t("common.info"),
            t("trainer.session.already_attended"),
            "info"
          );
          setIsScanning(false);
        }
      } else {
        showAlert(
          t("common.error"),
          t("trainer.session.student_not_in_list"),
          "error"
        );
        setIsScanning(false);
      }
    } catch (err) {
      // Error handled in toggleAttendance
    } finally {
      setIsProcessingQR(false);
    }
  };

  const startScan = async () => {
    if (!permission) {
      const { status } = await requestPermission();
      if (status !== "granted") {
        showAlert(
          t("common.error"),
          t("trainer.session.camera_permission_required"),
          "error"
        );
        return;
      }
    } else if (!permission.granted) {
      const { status } = await requestPermission();
      if (status !== "granted") {
        showAlert(
          t("common.error"),
          t("trainer.session.camera_permission_required"),
          "error"
        );
        return;
      }
    }
    setIsScanning(true);
  };

  const handleFinishSession = () => {
    showAlert(
      t("trainer.session.finish_confirm_title"),
      t("trainer.session.finish_confirm_msg"),
      "warning",
      {
        secondaryButtonText: t("common.cancel"),
        onPrimaryPress: async () => {
          try {
            // 1. Mark class as finished in DB
            const { error } = await supabase
              .from("classes")
              .update({ status: "finished" })
              .eq("id", id);

            if (error) throw error;

            showAlert(
              t("common.success"),
              t("trainer.session.finish_success"),
              "success",
              {
                onClose: () => router.back(),
              }
            );
          } catch (err: any) {
            showAlert(t("common.error"), err.message, "error");
          }
        },
      }
    );
  };

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
        <Text style={{ color: colors.text }}>
          {t("trainer.session.not_found")}
        </Text>
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
          {t("trainer.session.manage_title")}
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
            {dayjs(classData.start_time).format(
              t("trainer.schedule.time_format")
            )}{" "}
            -{" "}
            {dayjs(classData.end_time).format(
              t("trainer.schedule.time_format")
            )}
          </Text>
        </View>
        <Text style={{ color: colors.foreground_muted, marginTop: 4 }}>
          {dayjs(classData.start_time).format(
            t("trainer.schedule.date_format_full")
          )}
        </Text>
      </View>

      <View style={styles.listHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t("trainer.session.student_list", { count: students.length })}
        </Text>
        <TouchableOpacity
          onPress={startScan}
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
        >
          <FontAwesome name="qrcode" size={18} color="white" />
          <Text style={styles.scanButtonText}>
            {t("trainer.session.scan_qr")}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => {
          const isPresent = item.status === "completed";
          const isArrived = item.status === "arrived";
          return (
            <View
              style={[
                styles.studentCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isArrived ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.studentInfo}>
                <View
                  style={[
                    styles.avatarPlaceholder,
                    {
                      backgroundColor: isPresent
                        ? colors.success + "15"
                        : colors.primary_light,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isPresent ? colors.success : colors.primary,
                      fontWeight: "bold",
                    }}
                  >
                    {item.profiles?.full_name?.charAt(0) ||
                      t("common.unknown_name").charAt(0)}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.studentName, { color: colors.text }]}>
                    {item.profiles?.full_name || t("common.unknown_name")}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Text
                      style={[
                        styles.studentEmail,
                        { color: colors.foreground_muted },
                      ]}
                    >
                      {item.profiles?.email}
                    </Text>
                    {isArrived && (
                      <View
                        style={{
                          backgroundColor: colors.info + "20",
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            color: colors.info,
                          }}
                        >
                          {t("trainer.schedule.status_upcoming").toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
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
                        borderColor: isArrived
                          ? colors.primary
                          : colors.foreground_muted,
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
            {t("trainer.session.no_students")}
          </Text>
        }
      />

      <View style={{ paddingTop: 10 }}>
        <Button
          title={t("trainer.session.finish_class")}
          onPress={handleFinishSession}
        />
      </View>

      <CustomAlertComponent />

      {/* QR Scanner Modal */}
      <Modal
        visible={isScanning}
        animationType="slide"
        onRequestClose={() => setIsScanning(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              onPress={() => setIsScanning(false)}
              style={styles.closeScanner}
            >
              <FontAwesome name="times" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>
              {t("trainer.session.scan_qr_title")}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />

          <View style={styles.scannerOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>
              {t("trainer.session.scan_hint")}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
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

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600" },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  scanButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },

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
  scannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  closeScanner: {
    padding: 8,
  },
  scannerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "transparent",
    borderRadius: 16,
  },
  scanHint: {
    color: "white",
    marginTop: 24,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 40,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
