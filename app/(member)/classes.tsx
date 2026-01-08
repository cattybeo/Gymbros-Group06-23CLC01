import { ClassesSkeleton } from "@/components/ClassesSkeleton";
import { TrafficData } from "@/components/CrowdHeatmap";
import { LiveClassList } from "@/components/LiveClassList";
import Colors from "@/constants/Colors";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { AISuggestion, getAISmartSuggestion } from "@/lib/ai";
import { useAuthContext } from "@/lib/AuthContext";
import i18n from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import { GymClass } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ClassesScreen() {
  const { user, profile } = useAuthContext();
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficData[] | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [contentOpacity] = useState(new Animated.Value(0));
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { t } = useTranslation();
  const { showAlert, CustomAlertComponent } = useCustomAlert();
  const { colorScheme } = useThemeContext();
  const colors = Colors[colorScheme];

  const [myBookings, setMyBookings] = useState<Set<string>>(new Set());

  // AI Suggestion State
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Catalog State
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(
    async (forceRefreshAI = false, silent = false) => {
      const startTime = Date.now(); // 1. Start timer for UX Smoothing
      if (!silent) {
        setLoading(true);
        setDataReady(false);
        contentOpacity.setValue(0);
      }
      try {
        const [classesResponse, trafficResponse] = await Promise.all([
          supabase
            .from("classes")
            .select(
              "*, trainer:trainer_id(id, full_name, avatar_url, bio), location:locations(*)"
            )
            .order("start_time", { ascending: true }),
          supabase.rpc("get_weekly_traffic"),
        ]);

        if (classesResponse.error) throw classesResponse.error;
        const classesData = classesResponse.data || [];
        setClasses(classesData);

        if (trafficResponse.data) {
          setTrafficData(trafficResponse.data);
        }

        const classIds = classesData.map((c) => c.id);
        let userBookedIds: string[] = [];

        if (classIds.length > 0 && user) {
          const { data: myBookingsData } = await supabase
            .from("bookings")
            .select("class_id")
            .eq("user_id", user.id)
            .in("class_id", classIds)
            .in("status", ["confirmed", "checked_in"]);

          userBookedIds = [
            ...new Set(myBookingsData?.map((b) => b.class_id) || []),
          ];
          setMyBookings(new Set(userBookedIds));
        }

        // AI Analysis Trigger - Enhanced with persistent caching
        if (user && profile) {
          setAiLoading(true);
          getAISmartSuggestion(
            profile, // Use full profile with goals/metrics instead of user_metadata
            {
              availableClasses: classesData,
              userBookings: userBookedIds,
              currentTime: new Date().toISOString(),
              language: i18n.language,
            },
            forceRefreshAI
          )
            .then((res) => setSuggestion(res))
            .finally(() => setAiLoading(false));
        }

        // 2. UX: Ensure minimum loading time (800ms) to prevent Skeleton flickering
        if (!silent) {
          const elapsedTime = Date.now() - startTime;
          const MIN_LOADING_TIME = 800;
          if (elapsedTime < MIN_LOADING_TIME) {
            await new Promise((resolve) =>
              setTimeout(resolve, MIN_LOADING_TIME - elapsedTime)
            );
          }
          setDataReady(true);
        }
      } catch {
        if (!silent)
          showAlert(t("common.error"), t("classes.fetch_error"), "error");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [contentOpacity, t, showAlert, profile]
  );

  useFocusEffect(
    useCallback(() => {
      // If we already have data, do a silent refresh to avoid skeleton flicker
      fetchData(false, dataReady);
    }, [fetchData, dataReady])
  );

  useEffect(() => {
    const channel = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          fetchData(false, true); // Silent refresh
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Premium Fade-in Transition
  useEffect(() => {
    if (dataReady) {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [dataReady, contentOpacity]);

  const handleBook = useCallback(
    async (classId: string, currentCount: number) => {
      if (!user) {
        showAlert(
          t("auth.login_button"),
          t("classes.login_required"),
          "error",
          {
            onClose: () => router.push("/(auth)/sign-in"),
          }
        );
        return;
      }

      setBookingId(classId);

      try {
        const targetClass = classes.find((c) => c.id === classId);
        if (targetClass && currentCount >= targetClass.capacity) {
          showAlert(t("common.error"), t("classes.class_full"), "error");
          return;
        }

        // Overlap Detection (Task 2.1)
        if (targetClass) {
          const { data: myExistingBookings } = await supabase
            .from("bookings")
            .select("*, classes(start_time, end_time)")
            .eq("user_id", user.id)
            .in("status", ["confirmed", "checked_in"]);

          const hasOverlap = myExistingBookings?.some((b: any) => {
            if (!b.classes) return false;
            const bStart = new Date(b.classes.start_time).getTime();
            const bEnd = new Date(b.classes.end_time).getTime();
            const tStart = new Date(targetClass.start_time).getTime();
            const tEnd = new Date(targetClass.end_time).getTime();
            return bStart < tEnd && bEnd > tStart;
          });

          if (hasOverlap) {
            showAlert(t("common.error"), t("classes.overlap_error"), "error");
            setBookingId(null);
            return;
          }
        }

        // Membership Expiry Logic (Task 2.2)
        const { data: memberships, error: memError } = await supabase
          .from("user_memberships")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .gte("end_date", targetClass?.start_time || new Date().toISOString())
          .limit(1);

        if (memError || !memberships || memberships.length === 0) {
          showAlert(
            t("classes.membership_required"),
            t("classes.membership_required_msg"),
            "error",
            {
              primaryButtonText: t("common.confirm"),
              onPrimaryPress: () => router.push("/membership"),
            }
          );
          setBookingId(null);
          return;
        }

        // Optimistic Update (Task 3.2)
        setMyBookings((prev) => new Set(prev).add(classId));

        const { data: existingBooking } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .eq("class_id", classId)
          .single();

        if (existingBooking) {
          showAlert(t("common.error"), t("classes.already_booked"), "error");
          // Rollback
          setMyBookings((prev) => {
            const next = new Set(prev);
            next.delete(classId);
            return next;
          });
          setBookingId(null);
          return;
        }

        const { error: bookError } = await supabase.from("bookings").insert({
          user_id: user.id,
          class_id: classId,
          booking_date: new Date().toISOString(),
          status: "confirmed",
          status_payment: "unpaid",
        });

        if (bookError) throw bookError;

        await fetchData();
        showAlert(
          t("classes.booking_success"),
          t("classes.booking_success_msg"),
          "success"
        );
        fetchData(false, true); // Silent refresh to sync global counts
      } catch (error: any) {
        // Final Rollback
        setMyBookings((prev) => {
          const next = new Set(prev);
          next.delete(classId);
          return next;
        });
        showAlert(t("classes.booking_error"), error.message, "error");
      } finally {
        setBookingId(null);
      }
    },
    [classes, t, showAlert, fetchData]
  );

  const handleCancel = useCallback(
    async (classId: string) => {
      if (!user) return;

      showAlert(
        t("common.confirm"),
        t("classes.cancel_confirm_msg"),
        "warning",
        {
          primaryButtonText: t("common.no"),
          secondaryButtonText: t("common.yes"),
          onSecondaryPress: async () => {
            setBookingId(classId);
            // Optimistic Update (Task 3.2)
            setMyBookings((prev) => {
              const next = new Set(prev);
              next.delete(classId);
              return next;
            });

            try {
              const { error } = await supabase
                .from("bookings")
                .update({ status: "cancelled" })
                .eq("user_id", user.id)
                .eq("class_id", classId);

              if (error) throw error;

              showAlert(
                t("common.success"),
                t("classes.cancel_success_msg"),
                "success"
              );
              fetchData(false, true); // Silent refresh
            } catch (error: any) {
              // Rollback
              setMyBookings((prev) => new Set(prev).add(classId));
              showAlert(t("common.error"), error.message, "error");
            } finally {
              setBookingId(null);
            }
          },
        }
      );
    },
    [t, showAlert, fetchData]
  );

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchesSearch = c.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [classes, searchQuery]);

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const onResetFilters = useCallback(() => {
    setSearchQuery("");
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 bg-background pt-12 px-4">
        {!dataReady ? (
          <ClassesSkeleton />
        ) : (
          <Animated.View
            style={{ flex: 1, opacity: contentOpacity, marginTop: 48 }}
          >
            <View className="flex-row items-center bg-card px-4 py-3 rounded-xl border border-border mb-4">
              <Ionicons
                name="search"
                size={20}
                color={colors.foreground_secondary}
              />
              <TextInput
                placeholder={t("common.search")}
                placeholderTextColor={colors.foreground_secondary}
                className="flex-1 ml-2 text-foreground font-medium"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.foreground_secondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            <LiveClassList
              data={filteredClasses}
              allClasses={classes}
              handleBook={handleBook}
              handleCancel={handleCancel}
              bookingId={bookingId}
              myBookings={myBookings}
              trafficData={trafficData}
              isLoading={loading}
              onRefresh={onRefresh}
              aiSuggestion={suggestion}
              aiLoading={aiLoading}
              onResetFilters={onResetFilters}
            />
          </Animated.View>
        )}
        <CustomAlertComponent />
      </View>
    </KeyboardAvoidingView>
  );
}
