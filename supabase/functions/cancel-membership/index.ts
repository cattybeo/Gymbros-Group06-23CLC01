// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    if (!membershipId) {
      throw new Error("Missing membershipId");
    }

    // 1. Auth check (User's own context)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized");

    // 2. Admin access to update status
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify ownership and existence
    const { data: membership, error: fetchError } = await supabaseAdmin
      .from("user_memberships")
      .select("id, status")
      .eq("id", membershipId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !membership) {
      throw new Error("Membership not found or access denied");
    }

    // 3. Update status
    const { error: updateError } = await supabaseAdmin
      .from("user_memberships")
      .update({ status: "cancelled" })
      .eq("id", membershipId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(`Cancel Membership Error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
