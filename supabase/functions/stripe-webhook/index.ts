// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2.47.10";
import Stripe from "npm:stripe@16.12.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2025-12-15.clover",
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  let event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
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
