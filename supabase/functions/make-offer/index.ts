import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  listingId: z.string().uuid(),
  amount: z.number().positive(),
  message: z.string().optional().default(""),
});

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = BodySchema.parse(await request.json());
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase environment variables are missing");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: request.headers.get("Authorization") ?? "" } },
    });

    const { data: organisationId } = await supabase.rpc("current_organisation_id");
    if (!organisationId) throw new Error("Organisation not resolved");
    const { data: profile } = await supabase.from("profiles").select("id").eq("organisation_id", organisationId).limit(1).single();
    const { data: listing, error: listingError } = await supabase.from("marketplace_listings").select("*").eq("id", body.listingId).single();
    if (listingError || !listing) throw listingError ?? new Error("Listing not found");
    if (!["Live", "Under offer"].includes(listing.status)) throw new Error("Offers can only be made on live or under-offer listings");
    if (listing.organisation_id === organisationId) throw new Error("Sellers cannot offer on their own listing");
    if (body.amount < Number(listing.minimum_offer)) throw new Error(`Offer must be at least ${listing.minimum_offer}`);

    const { data: offer, error: offerError } = await supabase
      .from("marketplace_offers")
      .insert({
        listing_id: body.listingId,
        buyer_organisation_id: organisationId,
        buyer_user_id: profile?.id,
        seller_organisation_id: listing.organisation_id,
        amount: body.amount,
        status: "Submitted",
        message: body.message,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .select("id")
      .single();
    if (offerError || !offer) throw offerError ?? new Error("Offer could not be created");
    await supabase.from("marketplace_listings").update({ status: "Under offer" }).eq("id", body.listingId);
    await supabase.from("marketplace_events").insert({
      listing_id: body.listingId,
      organisation_id: organisationId,
      user_id: profile?.id,
      event_type: "offer_submitted",
      event_json: { amount: body.amount, notification: "mocked" },
    });

    return new Response(JSON.stringify({ offerId: offer.id, status: "Submitted", notification: "mocked" }), {
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
