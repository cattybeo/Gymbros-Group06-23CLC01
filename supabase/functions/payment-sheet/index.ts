// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2.47.10";
import Stripe from "npm:stripe@16.12.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2025-12-15.clover",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { planId, userId } = await req.json();
    console.log(
      `[PaymentSheet] Request received: userId=${userId}, planId=${planId}`
    );

    if (!planId || !userId) {
      throw new Error("Missing planId or userId");
    }

    // Initialize Supabase Client
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
      console.error(`[PaymentSheet] Plan fetch error:`, planError);
      throw new Error(`Plan not found: ${planId}`);
    }

    console.log(`[PaymentSheet] Creating customer for userId=${userId}`);
    const customer = await stripe.customers.create({
      metadata: { userId },
    });

    console.log(
      `[PaymentSheet] Creating ephemeral key for customerId=${customer.id}`
    );
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-12-18.acacia" }
    );

    console.log(
      `[PaymentSheet] Creating payment intent for amount=${plan.price}`
    );
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

    console.log(`[PaymentSheet] Success: intent=${paymentIntent.id}`);
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
    console.error(`[PaymentSheet] Error:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
