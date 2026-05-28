import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({ listingId: z.string().uuid() });

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { listingId } = BodySchema.parse(await request.json());
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase environment variables are missing");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: request.headers.get("Authorization") ?? "" } },
    });

    const { data: organisationId } = await supabase.rpc("current_organisation_id");
    if (!organisationId) throw new Error("Organisation not resolved");
    const { data: listing, error } = await supabase.from("marketplace_listings").select("*").eq("id", listingId).single();
    if (error || !listing) throw error ?? new Error("Listing not found");
    if (listing.organisation_id !== organisationId) throw new Error("Only the seller can publish this listing");
    if (!listing.seller_declaration_accepted) throw new Error("Seller declaration must be accepted before publishing");
    if (!listing.title || !listing.asking_price || !listing.bodywork_summary || !listing.mechanical_summary) {
      throw new Error("Listing is incomplete");
    }

    const { error: updateError } = await supabase
      .from("marketplace_listings")
      .update({ status: "Live", published_at: new Date().toISOString() })
      .eq("id", listingId);
    if (updateError) throw updateError;
    await supabase.from("marketplace_events").insert({
      listing_id: listingId,
      organisation_id: organisationId,
      event_type: "published",
      event_json: { declarationAccepted: true },
    });

    return new Response(JSON.stringify({ ok: true, status: "Live" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
