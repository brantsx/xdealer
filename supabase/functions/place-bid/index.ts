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
    if (listing.status !== "Live") throw new Error("Bids can only be placed on live listings");
    if (listing.organisation_id === organisationId) throw new Error("Sellers cannot bid on their own listing");
    const minimumBid = Number(listing.current_highest_bid ?? listing.reserve_price ?? 0) + Number(listing.bid_increment ?? 100);
    if (body.amount < minimumBid) throw new Error(`Bid must be at least ${minimumBid}`);

    await supabase.from("marketplace_bids").update({ status: "Outbid" }).eq("listing_id", body.listingId).eq("status", "Leading");
    const { data: bid, error: bidError } = await supabase
      .from("marketplace_bids")
      .insert({
        listing_id: body.listingId,
        bidder_organisation_id: organisationId,
        bidder_user_id: profile?.id,
        amount: body.amount,
        status: "Leading",
        message: body.message,
      })
      .select("id")
      .single();
    if (bidError || !bid) throw bidError ?? new Error("Bid could not be created");

    const { error: updateError } = await supabase
      .from("marketplace_listings")
      .update({ current_highest_bid: body.amount, current_highest_bid_id: bid.id })
      .eq("id", body.listingId);
    if (updateError) throw updateError;
    await supabase.from("marketplace_events").insert({
      listing_id: body.listingId,
      organisation_id: organisationId,
      user_id: profile?.id,
      event_type: "bid_placed",
      event_json: { amount: body.amount },
    });

    return new Response(JSON.stringify({ bidId: bid.id, status: "Leading" }), {
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
