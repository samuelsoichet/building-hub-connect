import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-08-16",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No Stripe signature found in request");
      return new Response(JSON.stringify({ error: "No signature provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, cryptoProvider);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Received verified Stripe event: ${event.type}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout session completed: ${session.id}`);

        const paymentId = session.metadata?.payment_id;

        if (paymentId) {
          const { error: updateError } = await supabase
            .from("payments")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              stripe_payment_intent_id: session.payment_intent as string,
              receipt_url: session.receipt_url || null,
            })
            .eq("id", paymentId);

          if (updateError) {
            console.error("Error updating payment:", updateError);
          } else {
            console.log(`Payment ${paymentId} marked as paid`);

            const tenantId = session.metadata?.tenant_id;
            if (tenantId && session.amount_total) {
              const amountPaid = session.amount_total / 100;

              const { data: balanceData } = await supabase
                .from("tenant_balances")
                .select("current_balance")
                .eq("tenant_id", tenantId)
                .single();

              if (balanceData) {
                const newBalance = (balanceData.current_balance || 0) - amountPaid;

                await supabase
                  .from("tenant_balances")
                  .update({
                    current_balance: newBalance,
                    last_payment_date: new Date().toISOString().split("T")[0],
                  })
                  .eq("tenant_id", tenantId);

                console.log(`Updated tenant ${tenantId} balance to ${newBalance}`);
              }

              await supabase.from("notifications").insert({
                user_id: tenantId,
                type: "payment_received",
                title: "Payment Received",
                message: `Your payment of $${amountPaid.toFixed(2)} has been received. Thank you!`,
                related_id: paymentId,
                related_type: "payment",
              });
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentId = session.metadata?.payment_id;

        if (paymentId) {
          await supabase.from("payments").update({ status: "cancelled" }).eq("id", paymentId);

          console.log(`Payment ${paymentId} marked as cancelled (session expired)`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed: ${paymentIntent.id}`);

        const { data: payments } = await supabase
          .from("payments")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .limit(1);

        if (payments && payments.length > 0) {
          await supabase.from("payments").update({ status: "failed" }).eq("id", payments[0].id);

          console.log(`Payment ${payments[0].id} marked as failed`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true, type: event.type }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
