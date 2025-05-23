
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
    const { sessionId, paymentId } = await req.json();
    
    if (!sessionId || !paymentId) {
      return new Response(
        JSON.stringify({ error: "Missing sessionId or paymentId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client to check auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the user from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: userError }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a service client to bypass RLS
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });
    
    // Get the payment to verify ownership
    const { data: payment, error: paymentError } = await serviceClient
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment not found", details: paymentError }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Make sure the payment belongs to the authenticated user
    if (payment.tenant_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized to access this payment" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-08-16",
    });
    
    // Check the payment status in Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // If the payment status is different from our record, update it
    if (
      (session.payment_status === "paid" && payment.status !== "paid") || 
      (session.status === "expired" && payment.status === "pending")
    ) {
      let newStatus = payment.status;
      let receiptUrl = payment.receipt_url;
      
      // Set the appropriate status based on Stripe's response
      if (session.payment_status === "paid") {
        newStatus = "paid";
        
        // Get receipt URL if available
        if (session.payment_intent) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
            if (paymentIntent.charges?.data[0]?.receipt_url) {
              receiptUrl = paymentIntent.charges.data[0].receipt_url;
            }
          } catch (error) {
            console.error("Failed to retrieve payment intent:", error);
          }
        }
      } else if (session.status === "expired") {
        newStatus = "expired";
      } else if (session.payment_status === "unpaid" && Date.now() > new Date(session.expires_at * 1000).getTime()) {
        newStatus = "expired";
      }
      
      // Update our payment record if status changed
      if (newStatus !== payment.status) {
        await serviceClient.rpc(
          "update_payment_status",
          { 
            payment_id: paymentId,
            new_status: newStatus,
            receipt_url: receiptUrl
          }
        );
        
        // Refresh payment data
        const { data: updatedPayment } = await serviceClient
          .from("payments")
          .select("*")
          .eq("id", paymentId)
          .single();
          
        if (updatedPayment) {
          payment.status = updatedPayment.status;
          payment.receipt_url = updatedPayment.receipt_url;
        }
      }
    }

    return new Response(
      JSON.stringify({
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          description: payment.description,
          receipt_url: payment.receipt_url,
          created_at: payment.created_at
        },
        stripe: {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          status: session.status
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in check-payment-status function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
