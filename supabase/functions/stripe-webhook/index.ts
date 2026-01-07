// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.4.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  let event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(err.message, { status: 400 });
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const { userId, planId } = paymentIntent.metadata;

    if (userId && planId) {
      console.log(
        `Webhook: Processing subscription for User ${userId} - Plan ${planId}`
      );

      // Initialize Supabase Client with Service Role Key
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Fetch plan details to get duration
      const { data: planData, error: planError } = await supabase
        .from("membership_plans")
        .select("duration_months")
        .eq("id", planId)
        .single();

      if (planError || !planData) {
        console.error(`Webhook Error: Plan not found ${planId}`, planError);
        // Returning 200 because we don't want Stripe to retry infinitely if the plan is genuinely gone
        return new Response("Plan not found", { status: 200 });
      }

      const durationMonths = planData.duration_months || 1;

      // Check for existing active membership to prevent date drift
      const { data: currentMembership } = await supabase
        .from("user_memberships")
        .select("end_date")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("end_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      let startDate = new Date();
      if (
        currentMembership &&
        new Date(currentMembership.end_date) > startDate
      ) {
        startDate = new Date(currentMembership.end_date);
      }

      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + durationMonths);

      const { error: insertError } = await supabase
        .from("user_memberships")
        .insert({
          user_id: userId,
          plan_id: planId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status: "active",
        });

      if (insertError) {
        console.error(
          "Webhook Error: Failed to insert membership:",
          insertError
        );
        // Return 500 to trigger retry for transient DB issues
        return new Response("Database Error", { status: 500 });
      }

      console.log(`Webhook Success: Membership activated for ${userId}`);
    } else {
      console.warn("Webhook Warning: Missing metadata (userId or planId)");
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
