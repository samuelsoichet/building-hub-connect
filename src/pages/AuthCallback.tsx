import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type UserRole = 'admin' | 'tenant' | 'maintenance';

const AuthCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const handledRef = useRef(false);
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fullUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const code = urlParams.get('code');
    const accessToken = hashParams.get('access_token');

    // React StrictMode in dev may mount/unmount/mount quickly. A ref is not enough.
    // Use sessionStorage to avoid double-processing the same callback across remounts.
    const callbackKey = `auth_callback_processed:${code || accessToken || 'none'}`;
    if (sessionStorage.getItem(callbackKey) === '1') {
      console.info('[AuthCallback] Callback already processed for this token, skipping. URL:', fullUrl);
      setIsProcessing(false);

      // If the session exists, redirect based on role.
      supabase.auth.getSession().then(async ({ data }) => {
        if (cancelled) return;
        if (!data.session) {
          navigate('/login', { replace: true });
          return;
        }

        try {
          const { data: roleData } = await (supabase as any)
            .from('user_roles')
            .select('role')
            .eq('user_id', data.session.user.id)
            .maybeSingle();

          const userRole = roleData?.role as UserRole | null;
          if (userRole === 'admin' || userRole === 'maintenance') {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/work-orders', { replace: true });
          }
        } catch {
          // If role lookup fails, still send user somewhere useful.
          navigate('/work-orders', { replace: true });
        }
      });

      return () => {
        cancelled = true;
      };
    }
    sessionStorage.setItem(callbackKey, '1');

    const clearRedirectTimer = () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };

    const safeNavigateToLogin = () => {
      clearRedirectTimer();
      redirectTimerRef.current = window.setTimeout(() => {
        if (!cancelled) navigate('/login', { replace: true });
      }, 3000);
    };

    const redirectWithRole = async (sessionUserId: string) => {
      // Fetch user role to determine redirect
      const { data: roleData } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', sessionUserId)
        .maybeSingle();

      const userRole = roleData?.role as UserRole | null;
      console.log('[AuthCallback] User role:', userRole);

      toast.success('Authentication successful!');

      if (userRole === 'admin' || userRole === 'maintenance') {
        console.log('[AuthCallback] Redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('[AuthCallback] Redirecting to work-orders...');
        navigate('/work-orders', { replace: true });
      }
    };

    const finishSuccess = async () => {
      if (handledRef.current) return;
      handledRef.current = true;
      clearRedirectTimer();

      // Clean up URL (remove tokens/codes)
      window.history.replaceState({}, document.title, '/auth/callback');

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!data.session) throw new Error('No session found after authentication.');

      await redirectWithRole(data.session.user.id);
    };

    const waitForSession = async (timeoutMs: number) => {
      const startedAt = Date.now();
      while (Date.now() - startedAt < timeoutMs) {
        const { data } = await supabase.auth.getSession();
        if (data.session) return;
        await new Promise((r) => setTimeout(r, 150));
      }
      throw new Error('Timed out waiting for session.');
    };

    const handleAuthCallback = async () => {
      try {
        console.log('[AuthCallback] Processing auth callback. URL:', fullUrl);
        console.log('[AuthCallback] Query:', window.location.search);
        console.log('[AuthCallback] Hash:', window.location.hash);

        const errorParam = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        // Handle error from URL
        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        // 1) PKCE flow (code in query params)
        if (code) {
          console.log('[AuthCallback] Found code parameter, exchanging for session...');
          try {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) throw exchangeError;
          } catch (err: any) {
            // In dev StrictMode, the first mount may get aborted during unmount.
            // Treat abort as non-fatal; we'll try to continue by waiting for session.
            const msg = String(err?.message || err);
            if (err?.name === 'AbortError' || msg.toLowerCase().includes('aborted')) {
              console.warn('[AuthCallback] exchangeCodeForSession aborted; will continue waiting for session.', err);
            } else {
              throw err;
            }
          }

          await waitForSession(2500);
          await finishSuccess();
          return;
        }

        // 2) Implicit flow (access_token in hash)
        if (accessToken) {
          console.log('[AuthCallback] Found access_token in hash. Waiting for session detection...');
          await waitForSession(2500);
          await finishSuccess();
          return;
        }

        // 3) No auth params, check for existing session
        console.log('[AuthCallback] No auth params found, checking for existing session...');
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          await finishSuccess();
          return;
        }

        throw new Error('No auth data found in callback URL.');
      } catch (err: any) {
        if (cancelled) return;
        console.error('[AuthCallback] Auth callback error:', err);
        const errorMessage = err?.message || 'Authentication failed. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
        safeNavigateToLogin();
      } finally {
        if (!cancelled) setIsProcessing(false);
      }
    };

    handleAuthCallback();

    return () => {
      cancelled = true;
      clearRedirectTimer();
    };
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
