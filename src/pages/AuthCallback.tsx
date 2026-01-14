import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AuthCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Processing auth callback. URL:", window.location.href);
        console.log("Search params:", window.location.search);
        console.log("Hash params:", window.location.hash);
        
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
          
          console.log("Successfully authenticated with code", data.session);
          toast.success("Authentication successful!");
          setRedirectTo('/work-orders');
        } 
        // If hash parameters exist (implicit flow - older method)
        else if (window.location.hash && window.location.hash.includes('access_token=')) {
          console.log("Found hash parameters in URL");
          
          // For hash-based auth, we just need to get the session - Supabase handles it automatically
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Get session error:", error);
            throw error;
          }
          
          if (data.session) {
            console.log("Successfully authenticated via hash params", data.session);
            toast.success("Authentication successful!");
            setRedirectTo('/work-orders');
          } else {
            throw new Error("No session found after hash authentication");
          }
        }
        // Check if session already exists (e.g., from auto-confirm flow)
        else {
          console.log("No auth params in URL, checking for existing session");
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            throw error;
          }
          
          if (data.session) {
            console.log("Found existing session", data.session);
            toast.success("Already logged in!");
            setRedirectTo('/work-orders');
          } else {
            console.warn("No authentication parameters or session found");
            toast.error("Authentication failed. Please try again.");
            setRedirectTo('/login');
          }
        }
      } catch (error) {
        console.error("Error processing authentication:", error);
        toast.error("Authentication failed. Please try again.");
        setRedirectTo('/login');
      } finally {
        setIsProcessing(false);
      }
    };
    
    handleAuthCallback();
  }, []);
  
  if (isProcessing) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary rounded-full border-t-transparent mb-4"></div>
        <p className="text-lg">Processing your login...</p>
      </div>
    );
  }
  
  // Redirect once processing is complete
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return null;
};

export default AuthCallback;
