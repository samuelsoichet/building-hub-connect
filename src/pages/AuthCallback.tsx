
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
        // Check if we have a code in the URL (PKCE flow)
        if (window.location.search.includes('code=')) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            window.location.search
          );
          
          if (error) {
            throw error;
          }
          
          console.log("Successfully authenticated with code", data.session);
          toast.success("Authentication successful!");
          setRedirectTo('/work-orders');
        } 
        // If hash parameters exist (implicit flow)
        else if (window.location.hash && window.location.hash.includes('access_token=')) {
          // Process the hash parameters
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            window.location.hash
          );
          
          if (error) {
            throw error;
          }
          
          console.log("Successfully authenticated via hash params", data.session);
          toast.success("Authentication successful!");
          setRedirectTo('/work-orders');
        }
        else {
          console.warn("No authentication parameters found in URL");
          toast.error("Authentication failed. No valid parameters found.");
          setRedirectTo('/login');
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
