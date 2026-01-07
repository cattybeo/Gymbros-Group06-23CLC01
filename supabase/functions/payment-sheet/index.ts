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
    const { planId, userId } = await req.json();

    if (!planId || !userId) {
      throw new Error("Missing planId or userId");
    }

    // Initialize Supabase Client to fetch actual price
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: plan, error: planError } = await supabase
      .from("membership_plans")
      .select("price, name")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    // 1. Create or Retrieve Customer
    // (Optimization: In a real app, mapping userId to stripe_customer_id is better)
    const customer = await stripe.customers.create({
      metadata: { userId },
    });

    // 2. Ephemeral Key
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2022-11-15" }
    );

    // 3. Payment Intent with Metadata (CRITICAL for Webhook)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.price,
      currency: "vnd",
      customer: customer.id,
      metadata: {
        userId: userId,
        planId: planId,
      },
      description: `Gymbros Membership: ${plan.name}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
        publishableKey: Deno.env.get("STRIPE_PUBLISHABLE_KEY"),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
