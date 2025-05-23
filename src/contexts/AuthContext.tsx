
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from '@supabase/supabase-js';
import { toast } from "sonner";

interface AuthContextType {
  isAuthenticated: boolean;
  email: string | null;
  user: User | null;
  session: Session | null;
  login: (email: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get the application URL based on current environment
const getAppUrl = () => {
  // Get the current hostname (domain)
  const hostname = window.location.hostname;
  
  // If we're on localhost, use the full origin (e.g., http://localhost:3000)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return window.location.origin;
  }
  
  // For deployed environments, ensure we use the current protocol and hostname
  return `${window.location.protocol}//${hostname}`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    // Check if we have a hash with auth data in the URL
    const handleHashParams = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        console.log("Found access token in URL hash");
        
        // Clear the hash to prevent re-authentication issues on refresh
        window.location.hash = '';
        
        try {
          // Let Supabase handle the session from the hash
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error processing auth redirect:', error);
            toast.error('Authentication failed. Please try again.');
            return;
          }
          
          // Successfully authenticated, redirect to work orders page
          if (data.session) {
            console.log("Successfully authenticated with session", data.session);
            window.location.href = `${window.location.origin}/work-orders`;
            return;
          }
        } catch (err) {
          console.error("Error processing hash params:", err);
          toast.error("Authentication failed. Please try again.");
        }
      }
    };

    // Handle hash params first
    handleHashParams();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.info(`Auth state changed: ${event}`);
        
        if (currentSession) {
          setIsAuthenticated(true);
          setEmail(currentSession.user?.email || null);
          setUser(currentSession.user);
          setSession(currentSession);

          // Store user/session data in localStorage
          localStorage.setItem('auth', JSON.stringify({ 
            isAuthenticated: true, 
            email: currentSession.user?.email 
          }));
        } else {
          setIsAuthenticated(false);
          setEmail(null);
          setUser(null);
          setSession(null);
          localStorage.removeItem('auth');
        }
        
        // Set initialization to false once we've processed the auth state
        setIsInitializing(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (currentSession) {
        console.log("Found existing session", currentSession);
        setIsAuthenticated(true);
        setEmail(currentSession.user?.email || null);
        setUser(currentSession.user);
        setSession(currentSession);

        // Store auth data for persistence
        localStorage.setItem('auth', JSON.stringify({ 
          isAuthenticated: true, 
          email: currentSession.user?.email 
        }));
      } else {
        console.log("No existing session found");
      }
      
      // Set initialization to false once we've checked for an existing session
      setIsInitializing(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string) => {
    try {
      console.log("Starting login process for:", email);
      const redirectTo = `${getAppUrl()}/work-orders`;
      console.log(`Setting redirect URL to: ${redirectTo}`);
      
      // Use signInWithOtp explicitly with all parameters logged
      console.log("Calling supabase.auth.signInWithOtp with:", {
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        }
      });
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        }
      });
      
      if (error) {
        console.error('Login error:', error);
        return { error: error.message };
      }
      
      console.log("OTP sign-in initiated successfully", data);
      return {};
    } catch (error: any) {
      console.error("Login error:", error);
      return { error: error.message || "Failed to send login link" };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error("Failed to log out");
      console.error("Logout error:", error);
    }
  };

  // Don't render children until we've initialized auth
  if (isInitializing) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, email, user, session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
