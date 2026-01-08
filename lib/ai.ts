import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { supabase } from "./supabase";
import { Profile } from "./types";

/**
 * Zod Schema for AI Response validation
 * Ensuring the LLM always returns the structure we expect.
 */
export const AISuggestionSchema = z.object({
  headline: z.string(),
  reasoning: z.string(),
  recommended_class_ids: z.array(z.string()).min(1),
  recommendation_type: z.enum(["class", "timing", "mixed"]),
  optimal_time: z.string().optional(),
  vibe_type: z.enum(["focus", "power", "calm", "social"]),
  smart_tags: z.array(z.string()).max(3),
});

export type AISuggestion = z.infer<typeof AISuggestionSchema>;

export const TrainerInsightsSchema = z.object({
  recap: z.object({
    summary: z.string(),
    attendance_rate: z.number(),
    trend: z.string(),
  }),
  retention_alerts: z.array(
    z.object({
      student_name: z.string(),
      reason: z.string(),
      action_suggestion: z.string(),
    })
  ),
  smart_broadcasts: z.array(
    z.object({
      type: z.enum(["friendly", "urgent", "motivational"]),
      message: z.string(),
    })
  ),
  vibe_type: z.enum(["success", "warning", "info"]),
});

export type TrainerInsights = z.infer<typeof TrainerInsightsSchema>;

const AI_CACHE_KEY = "gymbros_ai_cache";
const CACHE_TTL = 1000 * 60 * 60 * 4; // 4 hours

/**
 * Gymbros AI Engine - Trainer Assistant
 * Provides insights for PTs about their classes and students.
 */
export const getTrainerAIInsights = async (
  trainerProfile: Profile,
  context: {
    classSessions: any[];
    studentAttendance: any[];
    language?: string;
  }
): Promise<TrainerInsights | null> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      "gymbros-coach-ai",
      {
        body: {
          trainerProfile,
          classSessions: context.classSessions,
          studentAttendance: context.studentAttendance,
          language: context.language || "vi",
        },
      }
    );

    if (error) throw error;
    if (!data) return null;

    return TrainerInsightsSchema.parse(data);
  } catch (error) {
    console.error("Trainer AI Engine Error:", error);
    return null;
  }
};

/**
 * Gymbros AI Engine - Member Suggestions
 */
export const getAISmartSuggestion = async (
  userProfile: Profile,
  gymContext: {
    availableClasses: any[];
    userBookings: string[];
    currentTime: string;
    language?: string;
  },
  forceRefresh = false
): Promise<AISuggestion | null> => {
  try {
    // 1. Prepare Context Key (to detect if bookings/profile changed significantly)
    const contextHash = JSON.stringify({
      bookings: gymContext.userBookings.sort(),
      goal: userProfile?.goal,
      lang: gymContext.language,
    });

    // 2. Check Cache
    const cachedData = await AsyncStorage.getItem(AI_CACHE_KEY);
    let previousSuggestion: AISuggestion | null = null;

    if (cachedData) {
      const { data, timestamp, hash } = JSON.parse(cachedData);
      previousSuggestion = data;

      // Check if cache is still valid
      const isExpired = Date.now() - timestamp > CACHE_TTL;
      const hasContextChanged = hash !== contextHash;

      if (!forceRefresh && !isExpired && !hasContextChanged) {
        console.log("[AI Engine] Returning cached suggestion (Match)");
        return data;
      }
    }

    // 3. Invoke Edge Function with context
    const { data, error } = await supabase.functions.invoke("gymbros-ai", {
      body: {
        userProfile,
        availableClasses: gymContext.availableClasses,
        userBookings: gymContext.userBookings,
        currentTime: gymContext.currentTime,
        language: gymContext.language || "vi",
        previousSuggestion, // Pass context for stability
      },
    });

    if (error) {
      console.error("Supabase AI Function Error:", error);
      return previousSuggestion; // Fallback to old suggestion if it exists
    }

    if (!data) return null;

    // 4. Final safety check with Zod
    const validatedData = AISuggestionSchema.parse(data);

    // 5. Save to Cache
    await AsyncStorage.setItem(
      AI_CACHE_KEY,
      JSON.stringify({
        data: validatedData,
        timestamp: Date.now(),
        hash: contextHash,
      })
    );

    return validatedData;
  } catch (error) {
    console.error("Gymbros AI Engine Error:", error);
    return null;
  }
};
