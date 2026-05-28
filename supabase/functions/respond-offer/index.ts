import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  offerId: z.string().uuid(),
  response: z.enum(["accept", "reject", "counter"]),
  counterAmount: z.number().positive().optional(),
  counterMessage: z.string().optional(),
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
    const { data: offer, error: offerError } = await supabase.from("marketplace_offers").select("*").eq("id", body.offerId).single();
    if (offerError || !offer) throw offerError ?? new Error("Offer not found");
    if (offer.seller_organisation_id !== organisationId && offer.buyer_organisation_id !== organisationId) {
      throw new Error("Only the buyer or seller can respond to this offer");
    }
    if (body.response === "counter" && !body.counterAmount) throw new Error("counterAmount is required for counter offers");

    const status = body.response === "accept" ? "Accepted" : body.response === "reject" ? "Rejected" : "Countered";
    const nextSteps =
      body.response === "accept"
        ? ["Exchange details", "Arrange invoice", "Arrange collection/transport", "Confirm payment outside platform", "Mark complete"]
        : offer.next_steps ?? [];
    const { error: updateError } = await supabase
      .from("marketplace_offers")
      .update({
        status,
        counter_amount: body.response === "counter" ? body.counterAmount : offer.counter_amount,
        counter_message: body.response === "counter" ? body.counterMessage : offer.counter_message,
        next_steps: nextSteps,
      })
      .eq("id", body.offerId);
    if (updateError) throw updateError;

    if (body.response === "accept") {
      await supabase.from("marketplace_listings").update({ status: "Reserved" }).eq("id", offer.listing_id);
    }
    await supabase.from("marketplace_events").insert({
      listing_id: offer.listing_id,
      organisation_id: organisationId,
      user_id: profile?.id,
      event_type: `offer_${body.response}`,
      event_json: { offerId: body.offerId, counterAmount: body.counterAmount, nextStepsCreated: body.response === "accept" },
    });

    return new Response(JSON.stringify({ offerId: body.offerId, status, nextSteps }), {
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
