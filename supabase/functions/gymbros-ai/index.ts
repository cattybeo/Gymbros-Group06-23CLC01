// @ts-nocheck
import { GoogleGenAI } from "npm:@google/genai";
import { zodToJsonSchema } from "npm:zod-to-json-schema@3.24.1";
import { z } from "npm:zod@3.24.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Zod Schema for Gymbros AI Advice
 * We use Zod to define the schema and then convert it to JSON Schema for Gemini.
 */
const AISuggestionSchema = z.object({
  headline: z.string().describe("Catchy summary of the recommendation"),
  reasoning: z.string().describe("Personalized explanation for the user"),
  recommended_class_ids: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe("Exactly 3 IDs of recommended classes from the provided list"),
  recommendation_type: z.enum(["class", "timing", "mixed"]),
  optimal_time: z.string().optional().describe("Best time for gym activity"),
  vibe_type: z.enum(["focus", "power", "calm", "social"]),
  smart_tags: z.array(z.string()).max(3),
});

// Convert Zod schema to JSON Schema for Gemini
const responseSchema = zodToJsonSchema(AISuggestionSchema);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      userProfile,
      availableClasses,
      userBookings,
      currentTime,
      language,
    } = await req.json();

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    // Unified Google Gen AI SDK (@google/genai) - 2025 GA Standard
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are the Gymbros AI Personal Trainer.
      Providing premium, encouraging, and highly personalized recommendations.

      LANGUAGE REQUIREMENT:
      You MUST respond ONLY in the following language: ${language || "vi"}. 
      Ensure everything from the headline to the reasoning is in this language.

      USER PROFILE:
      ${JSON.stringify(userProfile, null, 2)}

      AVAILABLE CLASSES:
      ${JSON.stringify(
        availableClasses.map((c: any) => ({
          id: c.id,
          name: c.name,
          start_time: c.start_time,
          type: c.type,
        })),
        null,
        2
      )}

      USER'S CURRENT BOOKINGS:
      ${JSON.stringify(userBookings, null, 2)}

      CURRENT TIME: ${currentTime}

      TASK:
      1. Analyze the user goals and schedule.
      2. Suggest EXACTLY 3 classes the user has NOT booked.
      3. Use a friendly, high-end professional tone.
      4. DO NOT include classes not in the list.
    `;

    // Gemini 2.5 Series (2025-2026 Production Model)
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: {
          thinkingBudget: -1, // Dynamic thinking: Model adjusts tokens based on complexity for optimal suggestions
        },
      },
    });

    const resultText = response.text;

    if (!resultText) {
      throw new Error("No content generated from Gemini");
    }

    return new Response(resultText, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(`[gymbros-ai] Error:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
