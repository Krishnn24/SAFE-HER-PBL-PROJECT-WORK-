import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* -------------------- CORS -------------------- */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* -------------------- FUNCTION -------------------- */
serve(async (req) => {
  // ✅ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    /* -------------------- AUTH -------------------- */
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    /* -------------------- BODY -------------------- */
    const { alert_id, latitude, longitude, trigger_method } =
      await req.json();

    if (!alert_id) {
      return new Response(
        JSON.stringify({ error: "Missing alert_id" }),
        { status: 400, headers: corsHeaders }
      );
    }

    /* -------------------- CONTACTS -------------------- */
    const { data: contacts, error: contactsError } =
      await supabaseAdmin
        .from("trusted_contacts")
        .select("name, phone")
        .eq("user_id", user.id);

    if (contactsError) {
      return new Response(
        JSON.stringify({ error: contactsError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    /* -------------------- LOG (TEMP) -------------------- */
    console.log("SOS ALERT", {
      alert_id,
      user_id: user.id,
      trigger_method,
      latitude,
      longitude,
      contacts,
    });

    /* -------------------- SUCCESS -------------------- */
    return new Response(
      JSON.stringify({
        success: true,
        notified_contacts: contacts?.length ?? 0,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
