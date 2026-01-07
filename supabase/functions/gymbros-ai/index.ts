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
const schema = zodToJsonSchema(AISuggestionSchema);
// Gemini requires a clean schema without $schema or absolute refs
const responseSchema = {
  type: schema.type,
  properties: schema.properties,
  required: schema.required,
  description: schema.description,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[gymbros-ai] Received request body keys:", Object.keys(body));

    const {
      userProfile,
      availableClasses,
      userBookings,
      currentTime,
      language,
      previousSuggestion, // Context for consistency
    } = body;

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("[gymbros-ai] Missing GEMINI_API_KEY");
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY is not set in Supabase Secrets",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Unified Google Gen AI SDK (@google/genai) - 2025 GA Standard
    const ai = new GoogleGenAI({ apiKey });

    // Build Consistency Strategy
    let consistencyInstructions = "";
    if (previousSuggestion) {
      consistencyInstructions = `
      CONSISTENCY CONTEXT:
      You previously suggested: "${previousSuggestion.headline}"
      Reasoning was: "${previousSuggestion.reasoning}"
      Class IDs: ${previousSuggestion.recommended_class_ids.join(", ")}

      STABILITY RULE:
      If those 3 classes are still available in the list below AND the user hasn't booked them yet, 
      you MUST prioritize returning the SAME recommendations to maintain a stable coaching relationship. 
      Only pivot if those classes are no longer in the AVAILABLE CLASSES list or are now full/booked.
      `;
    }

    const prompt = `
      You are the Gymbros AI Personal Trainer.
      Providing premium, encouraging, and highly personalized recommendations.

      LANGUAGE REQUIREMENT:
      You MUST respond ONLY in the following language: ${language || "vi"}. 
      Ensure everything from the headline to the reasoning is in this language.

      ${consistencyInstructions}

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

    console.log("[gymbros-ai] Calling Gemini 2.5 Flash...");

    // Gemini 2.5 Series (2025-2026 Production Model)
    let result;
    try {
      result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          thinkingConfig: {
            // For 2.5-flash, a positive budget is often safer than -1 in some preview regions
            thinkingBudget: 2048,
          },
        },
      });
    } catch (aiError: any) {
      console.error("[gymbros-ai] Gemini API Call Failed:", aiError);
      return new Response(
        JSON.stringify({
          error: "Gemini API Call Failed",
          details: aiError.message,
          hint: "This usually means the API key is invalid or the model is not available in your region.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[gymbros-ai] Gemini responded successfully.");

    // Defensive check for result text across different SDK versions
    let resultText = "";
    if (result.text) {
      resultText = result.text;
    } else if (result.response?.text) {
      resultText = result.response.text();
    } else {
      // Fallback: extract from parts
      const part = result.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.text
      );
      if (part) resultText = part.text;
    }

    if (!resultText) {
      console.error(
        "[gymbros-ai] Empty result text. result:",
        JSON.stringify(result)
      );
      return new Response(
        JSON.stringify({ error: "Gemini returned an empty response." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      "[gymbros-ai] Returning result text (length):",
      resultText.length
    );

    return new Response(resultText, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(`[gymbros-ai] Critical Error:`, error);
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
        hint: "Check if GEMINI_API_KEY is set and model name is correct for your region.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
