import { ClassCatalog } from "@/components/ClassCatalog";
import { ClassesSkeleton } from "@/components/ClassesSkeleton";
import { LiveClassList } from "@/components/LiveClassList";
import Colors from "@/constants/Colors";
import { useCustomAlert } from "@/hooks/useCustomAlert";
import { AISuggestion, getAISmartSuggestion } from "@/lib/ai";
import i18n from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { useThemeContext } from "@/lib/theme";
import { GymClass } from "@/lib/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
  const [classes, setClasses] = useState<GymClass[]>([]);
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
  const [selectedType, setSelectedType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

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

  async function fetchData() {
    setLoading(true);
    setDataReady(false);
    contentOpacity.setValue(0);
    try {
      const [userResponse, classesResponse] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("classes")
          .select("*")
          .order("start_time", { ascending: true }),
      ]);

      const user = userResponse.data.user;

      if (classesResponse.error) throw classesResponse.error;
      const classesData = classesResponse.data || [];
      setClasses(classesData);

      const classIds = classesData.map((c) => c.id);
      let userBookedIds: string[] = [];

      if (classIds.length > 0 && user) {
        const { data: myBookingsData } = await supabase
          .from("bookings")
          .select("class_id")
          .eq("user_id", user.id)
          .in("class_id", classIds)
          .in("status", ["confirmed", "checked_in"]);

        userBookedIds = myBookingsData?.map((b) => b.class_id) || [];
        setMyBookings(new Set(userBookedIds));
      }

      // AI Analysis Trigger - Enhanced context
      if (user) {
        setAiLoading(true);
        getAISmartSuggestion(user.user_metadata, {
          availableClasses: classesData,
          userBookings: userBookedIds,
          currentTime: new Date().toISOString(),
          language: i18n.language,
        })
          .then((res) => setSuggestion(res))
          .finally(() => setAiLoading(false));
      }

      setDataReady(true);
    } catch (error) {
      console.error(error);
      showAlert(t("common.error"), t("classes.fetch_error"), "error");
    } finally {
      setLoading(false);
    }
  }

  const handleBook = useCallback(
    async (classId: string, currentCount: number) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

        const { data: memberships, error: memError } = await supabase
          .from("user_memberships")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .gte("end_date", new Date().toISOString())
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

        const { data: existingBooking } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .eq("class_id", classId)
          .single();

        if (existingBooking) {
          showAlert(t("common.error"), t("classes.already_booked"), "error");
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

        showAlert(
          t("classes.booking_success"),
          t("classes.booking_success_msg"),
          "success"
        );
        fetchData();
      } catch (error: any) {
        showAlert(t("classes.booking_error"), error.message, "error");
      } finally {
        setBookingId(null);
      }
    },
    [classes, t, showAlert]
  );

  const uniqueClassTypes = useMemo(() => {
    const typesMap = new Map<string, { name: string; image_slug: string }>();
    classes.forEach((c) => {
      if (!typesMap.has(c.name)) {
        typesMap.set(c.name, { name: c.name, image_slug: c.image_slug });
      }
    });
    return Array.from(typesMap.values());
  }, [classes]);

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchesType = selectedType === "All" || c.name === selectedType;
      const matchesSearch = c.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [classes, selectedType, searchQuery]);

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
            <View className="flex-row items-center bg-card border border-border rounded-token-lg px-3 py-2 mb-4">
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
              bookingId={bookingId}
              myBookings={myBookings}
              renderCatalog={() => (
                <ClassCatalog
                  selectedType={selectedType}
                  setSelectedType={setSelectedType}
                  uniqueClassTypes={uniqueClassTypes}
                  colors={colors}
                />
              )}
              isLoading={loading}
              onRefresh={fetchData}
              aiSuggestion={suggestion}
              aiLoading={aiLoading}
              onResetFilters={() => {
                setSearchQuery("");
                setSelectedType("All");
              }}
            />
          </Animated.View>
        )}
        <CustomAlertComponent />
      </View>
    </KeyboardAvoidingView>
  );
}
