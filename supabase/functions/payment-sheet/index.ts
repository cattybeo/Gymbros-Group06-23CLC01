// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    // Hardcode details for MVP if DB access is hard from Edge without Service Role
    // Ideal: Fetch price using Supabase Client here.
    // For now: Just switch on planId to get price.

    // Map planId to amount (in cents)
    // Silver: 500,000 VND -> ~20 USD (just using mocked USD for global stripe test) or VND if supported.
    // Stripe Test supports VND? Yes.

    let amount = 500000; // Default Silver
    if (planId.includes("gold")) amount = 1200000;
    if (planId.includes("platinum")) amount = 2000000;

    // 1. Create or Retrieve Customer (Mock: always create new or finding by email not implemented yet)
    // Ideally we store stripe_customer_id in profiles.

    const customer = await stripe.customers.create();

    // 2. Ephemeral Key
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2022-11-15" }
    );

    // 3. Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "vnd",
      customer: customer.id,
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
