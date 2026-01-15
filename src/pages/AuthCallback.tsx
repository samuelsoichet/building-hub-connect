import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type UserRole = 'admin' | 'tenant' | 'maintenance';

const AuthCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double processing
    if (processedRef.current) return;
    processedRef.current = true;

    const handleAuthCallback = async () => {
      try {
        console.log("Processing auth callback. URL:", window.location.href);
        
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const code = urlParams.get('code');
        const accessToken = hashParams.get('access_token');
        const errorParam = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        // Handle error from URL
        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        let session = null;

        // Handle PKCE flow (code in query params)
        if (code) {
          console.log("Found code parameter, exchanging for session...");
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            throw exchangeError;
          }
          
          session = data.session;
          console.log("Successfully exchanged code for session");
        }
        // Handle implicit flow (access_token in hash)
        else if (accessToken) {
          console.log("Found access_token in hash, getting session...");
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }
          
          session = data.session;
          console.log("Successfully retrieved session from hash");
        }
        // No auth params, check for existing session
        else {
          console.log("No auth params found, checking for existing session...");
          const { data, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }
          
          session = data.session;
        }

        if (session) {
          console.log("Session found, fetching user role...");
          
          // Clean up URL
          window.history.replaceState({}, document.title, '/auth/callback');
          
          // Fetch user role to determine redirect
          const { data: roleData } = await (supabase as any)
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const userRole = roleData?.role as UserRole | null;
          console.log("User role:", userRole);

          toast.success("Authentication successful!");

          // Redirect based on role
          if (userRole === 'admin' || userRole === 'maintenance') {
            console.log("Redirecting to dashboard...");
            navigate('/dashboard', { replace: true });
          } else {
            console.log("Redirecting to work-orders...");
            navigate('/work-orders', { replace: true });
          }
        } else {
          throw new Error("No session found. Please try logging in again.");
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        const errorMessage = err.message || "Authentication failed. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-4">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Authentication Failed</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center">
      <div className="animate-spin h-12 w-12 border-4 border-primary rounded-full border-t-transparent mb-4"></div>
      <p className="text-lg font-medium">Processing your login...</p>
      <p className="text-sm text-muted-foreground mt-2">Please wait while we verify your credentials.</p>
    </div>
  );
};

export default AuthCallback;
