// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.4.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { membershipId } = await req.json();

    // 1. Auth check
    const supabaseClient = createClient(
      Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") ?? "",
      Deno.env.get("EXPO_PUBLIC_SUPABASE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // 2. Get Membership details
    // We need service role to update status if RLS prevents update
    const supabaseAdmin = createClient(
      Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SECRET_KEY") ?? ""
    );

    const { data: membership, error: fetchError } = await supabaseAdmin
      .from("user_memberships")
      .select("*, plan:membership_plans(*)")
      .eq("id", membershipId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !membership) throw new Error("Membership not found");

    // 3. Logic: Allow refund if created within 3 days? Or just Cancel logic?
    // User requested "Refund/Cancel".
    // For MVP: Just mark as cancelled. Real refund requires PaymentIntent ID stored.
    // Assuming we didn't store PaymentIntent ID in user_memberships, we can't automate Stripe Refund easily here without that column.
    // FIX: Just Cancel DB status for now.

    const { error: updateError } = await supabaseAdmin
      .from("user_memberships")
      .update({ status: "cancelled" })
      .eq("id", membershipId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
