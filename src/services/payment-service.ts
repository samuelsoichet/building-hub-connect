
import { supabase } from "@/integrations/supabase/client";

export async function createCheckoutSession(amount: number, description?: string) {
  try {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { amount, description },
    });
    
    if (error) {
      throw new Error(`Error creating checkout: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function checkPaymentStatus(sessionId: string, paymentId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('check-payment-status', {
      body: { sessionId, paymentId },
    });
    
    if (error) {
      throw new Error(`Error checking payment status: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw error;
  }
}

export async function fetchPaymentHistory() {
  try {
    // This will automatically use the authenticated user's session
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Error fetching payment history: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
}

export async function fetchTenantBalance() {
  try {
    // This will automatically use the authenticated user's session
    const { data, error } = await supabase
      .from('tenant_balances')
      .select('*')
      .single();
    
    if (error) {
      // If the balance doesn't exist yet, return a default object
      if (error.code === 'PGRST116') {
        return {
          current_balance: 0,
          rent_amount: 0,
          next_payment_due: null,
          last_payment_date: null,
          suite_number: ''
        };
      }
      throw new Error(`Error fetching tenant balance: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching tenant balance:', error);
    throw error;
  }
}
