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
 * Zod Schema for Gymbros Trainer AI Coach
 * This assistant helps the Trainer (PT) manage their classes and students.
 */
const TrainerAssistantSchema = z.object({
  recap: z.object({
    summary: z.string().describe("Brief overview of today's performance"),
    attendance_rate: z.number().describe("Percentage of attended vs booked"),
    trend: z.string().describe("Growth/Decline compared to previous sessions"),
  }),
  retention_alerts: z
    .array(
      z.object({
        student_name: z.string(),
        reason: z
          .string()
          .describe("Why this student is at risk (e.g. absent 2x)"),
        action_suggestion: z.string().describe("What the trainer should say"),
      })
    )
    .max(3),
  smart_broadcasts: z.array(
    z.object({
      type: z.enum(["friendly", "urgent", "motivational"]),
      message: z.string().describe("Drafted message for the class group"),
    })
  ),
  vibe_type: z.enum(["success", "warning", "info"]),
});

const schema = zodToJsonSchema(TrainerAssistantSchema);
const responseSchema = {
  type: schema.type,
  properties: schema.properties,
  required: schema.required,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      trainerProfile,
      classSessions, // Detailed list of recent/upcoming classes
      studentAttendance, // Historical attendance data (anonymized)
      language,
    } = body;

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are the "Gymbros AI Coach Assistant"—a virtual consultant for Personal Trainers (PTs).
      Your goal is to help the coach analyze their class performance and student retention.

      TRAINER PROFILE:
      - Name: ${trainerProfile.full_name}
      - Specialties: ${trainerProfile.specialties?.join(", ") || "General Training"}

      CLASS CONTEXT (Recent & Upcoming):
      ${JSON.stringify(classSessions, null, 2)}

      STUDENT DATA (Anonymized Attendance):
      ${JSON.stringify(studentAttendance, null, 2)}

      LANGUAGE: ${language || "vi"}

      TASK:
      1. ANALYZE CLASS RECAP: Compare the actual attendance vs capacity. Is there a trend?
      2. RETENTION ALERT: Identify students who have been 'absent' or missing recently.
      3. SMART BROADCAST: Draft 3 variations of a message to send to the upcoming class group.
      
      TONE: Professional, insightful, and supportive of the trainer's business growth.
    `;

    console.log("[gymbros-coach-ai] Calling Gemini 2.5 Flash...");

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const resultText = result.text || result.response?.text?.() || "";

    return new Response(resultText, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
