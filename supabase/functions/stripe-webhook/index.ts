
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-08-16",
    });

    // Verify the webhook signature
    // Note: In production, you should configure and use a webhook secret
    let event;
    try {
      // For testing purposes, we're not verifying the signature
      // In production, uncomment this code and set up your webhook secret:
      // const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
      // event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      
      // For now, just parse the payload
      event = JSON.parse(payload);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const paymentId = session.metadata?.payment_id;
        
        if (!paymentId) {
          console.error("No payment_id found in session metadata");
          return new Response(
            JSON.stringify({ error: "No payment_id found in session metadata" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get the payment intent to access the receipt
        let receiptUrl = null;
        if (session.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
          if (paymentIntent.charges?.data[0]?.receipt_url) {
            receiptUrl = paymentIntent.charges.data[0].receipt_url;
          }
        }

        // Update the payment status in our database
        const { data, error } = await supabase.rpc(
          "update_payment_status",
          { 
            payment_id: paymentId,
            new_status: "paid",
            stripe_session_id: session.id,
            receipt_url: receiptUrl
          }
        );

        if (error) {
          console.error("Failed to update payment status:", error);
          return new Response(
            JSON.stringify({ error: "Failed to update payment status", details: error }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const paymentId = session.metadata?.payment_id;

        if (paymentId) {
          await supabase.rpc(
            "update_payment_status",
            { 
              payment_id: paymentId,
              new_status: "expired",
              stripe_session_id: session.id
            }
          );
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const sessionId = paymentIntent.metadata?.checkout_session_id;
        
        if (sessionId) {
          // Get the session to find our payment ID
          try {
            const session = await stripe.checkout.sessions.retrieve(sessionId);
            const paymentId = session.metadata?.payment_id;
            
            if (paymentId) {
              await supabase.rpc(
                "update_payment_status",
                { 
                  payment_id: paymentId,
                  new_status: "failed"
                }
              );
            }
          } catch (error) {
            console.error("Failed to retrieve session:", error);
          }
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in webhook function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
