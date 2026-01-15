import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AuthCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    let isMounted = true;
    
    const handleAuthCallback = async () => {
      try {
        console.log("Processing auth callback. URL:", window.location.href);
        
        // Check if we have a code in the URL (PKCE flow - used by magic links)
        if (window.location.search.includes('code=')) {
          console.log("Found code parameter in URL, exchanging for session");
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            window.location.search
          );
          
          if (error) {
            console.error("Exchange code error:", error);
            throw error;
          }
          
          if (data.session && isMounted) {
            console.log("Successfully authenticated with code");
            toast.success("Authentication successful!");
            // Use navigate instead of Navigate component to avoid race conditions
            navigate('/work-orders', { replace: true });
            return;
          }
        } 
        // If hash parameters exist (implicit flow - older method)
        else if (window.location.hash && window.location.hash.includes('access_token=')) {
          console.log("Found hash parameters in URL");
          
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Get session error:", error);
            throw error;
          }
          
          if (data.session && isMounted) {
            console.log("Successfully authenticated via hash params");
            toast.success("Authentication successful!");
            navigate('/work-orders', { replace: true });
            return;
          } else {
            throw new Error("No session found after hash authentication");
          }
        }
        // Check if session already exists (e.g., from AuthContext processing)
        else {
          console.log("No auth params in URL, checking for existing session");
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            throw error;
          }
          
          if (data.session && isMounted) {
            console.log("Found existing session");
            toast.success("Already logged in!");
            navigate('/work-orders', { replace: true });
            return;
          } else {
            console.warn("No authentication parameters or session found");
            toast.error("Authentication failed. Please try again.");
            if (isMounted) navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.error("Error processing authentication:", error);
        toast.error("Authentication failed. Please try again.");
        if (isMounted) navigate('/login', { replace: true });
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };
    
    handleAuthCallback();
    
    return () => {
      isMounted = false;
    };
  }, [navigate]);
  
  if (isProcessing) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary rounded-full border-t-transparent mb-4"></div>
        <p className="text-lg">Processing your login...</p>
      </div>
    );
  }
  
  return null;
};

export default AuthCallback;
