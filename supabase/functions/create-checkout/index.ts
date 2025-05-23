
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { amount, description = "Rent Payment" } = await req.json();
    
    // Validate the payment amount
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid payment amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
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

    // Get the user from the JWT token
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

    // Get the tenant profile
    const { data: profile, error: profileError } = await serviceClient
      .from("tenant_profiles")
      .select("*")
      .eq("tenant_id", user.id)
      .single();

    if (profileError) {
      console.error("Profile error:", profileError);
      // If no profile exists, create one
      if (profileError.code === "PGRST116") {
        await serviceClient.from("tenant_profiles").insert({
          tenant_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || ""
        });
      } else {
        return new Response(
          JSON.stringify({ error: "Failed to retrieve tenant profile", details: profileError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-08-16",
    });

    // Get or create a Stripe customer
    let customerId = profile?.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || user.user_metadata?.full_name || user.email,
        metadata: {
          tenant_id: user.id,
        },
      });
      
      customerId = customer.id;
      
      // Update the tenant profile with the Stripe customer ID
      await serviceClient
        .from("tenant_profiles")
        .update({ stripe_customer_id: customerId })
        .eq("tenant_id", user.id);
    }

    // Calculate the amount in cents for Stripe
    const amountInCents = Math.round(Number(amount) * 100);
    
    // Create a new payment record in our database
    const { data: paymentRecord, error: paymentError } = await serviceClient
      .from("payments")
      .insert({
        tenant_id: user.id,
        amount: amount,
        description: description,
        status: "pending",
        stripe_customer_id: customerId
      })
      .select()
      .single();

    if (paymentError) {
      return new Response(
        JSON.stringify({ error: "Failed to create payment record", details: paymentError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the origin for success/cancel URLs
    const origin = req.headers.get("origin") || "https://kbikqglekastbsyqcarn.lovable.app";
    
    // Create the Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: description || "Rent Payment",
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payments?success=true&session_id={CHECKOUT_SESSION_ID}&payment_id=${paymentRecord.id}`,
      cancel_url: `${origin}/payments?success=false`,
      metadata: {
        payment_id: paymentRecord.id,
        tenant_id: user.id,
      },
    });

    // Update the payment record with the session ID
    await serviceClient
      .from("payments")
      .update({ stripe_session_id: session.id })
      .eq("id", paymentRecord.id);

    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url,
        paymentId: paymentRecord.id
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in create-checkout function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
