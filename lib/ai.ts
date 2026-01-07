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

/**
 * Gymbros AI Engine
 * Calls Supabase Edge Function to process AI logic securely.
 */
export const getAISmartSuggestion = async (
  userProfile: any,
  gymContext: {
    availableClasses: any[];
    userBookings: string[];
    currentTime: string;
    language?: string;
  }
): Promise<AISuggestion | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("gymbros-ai", {
      body: {
        userProfile,
        availableClasses: gymContext.availableClasses,
        userBookings: gymContext.userBookings,
        currentTime: gymContext.currentTime,
        language: gymContext.language || "vi",
      },
    });

    if (error) {
      console.error("Supabase AI Function Error:", error);
      return null;
    }

    if (!data) return null;

    // Final safety check with Zod
    return AISuggestionSchema.parse(data);
  } catch (error) {
    console.error("Gymbros AI Engine Error:", error);
    return null;
  }
};
