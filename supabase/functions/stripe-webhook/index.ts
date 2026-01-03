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
        `Processing subscription for User ${userId} - Plan ${planId}`
      );

      // Initialize Supabase Client with Service Role Key to bypass RLS
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Determine duration (Hardcoded logic similar to payment-sheet or fetch from DB)
      // Ideally fetch from DB, but for MVP consistency let's fetch or logic map
      // Fetch plan details to get duration
      const { data: planData } = await supabase
        .from("membership_plans")
        .select("duration_months")
        .eq("id", planId)
        .single();

      const durationMonths = planData?.duration_months || 1;

      // FIX: Check for existing active membership to prevent date drift
      const { data: currentMembership } = await supabase
        .from("user_memberships")
        .select("end_date")
        .eq("user_id", userId)
        // logic: if renewing same plan or upgrading, we usually add time.
        // For simplicity, always add time if 'active' membership exists.
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

      const { error } = await supabase.from("user_memberships").insert({
        user_id: userId,
        plan_id: planId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
      });

      if (error) {
        console.error("Error activating membership:", error);
        return new Response("Database Error", { status: 500 });
      }
      console.log("Membership activated successfully!");
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
