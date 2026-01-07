import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { supabase } from "./supabase";

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

const AI_CACHE_KEY = "gymbros_ai_cache";
const CACHE_TTL = 1000 * 60 * 60 * 4; // 4 hours

/**
 * Gymbros AI Engine
 * Calls Supabase Edge Function to process AI logic securely.
 * Features:
 * - Persistent Caching (AsyncStorage)
 * - Consistency Context (Passing previous suggestions)
 */
export const getAISmartSuggestion = async (
  userProfile: any,
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
      goal: userProfile?.goal_label,
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
