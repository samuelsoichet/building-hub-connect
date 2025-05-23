
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
  if (hostname === 'localhost') {
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

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
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
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (currentSession) {
        setIsAuthenticated(true);
        setEmail(currentSession.user?.email || null);
        setUser(currentSession.user);
        setSession(currentSession);

        // Store auth data for persistence
        localStorage.setItem('auth', JSON.stringify({ 
          isAuthenticated: true, 
          email: currentSession.user?.email 
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string) => {
    try {
      const redirectTo = `${getAppUrl()}/work-orders`;
      console.log(`Setting redirect URL to: ${redirectTo}`);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        }
      });
      
      if (error) {
        toast.error(error.message);
        return { error: error.message };
      }
      
      toast.success("Check your email for the login link");
      return {};
    } catch (error: any) {
      toast.error("Failed to send login link");
      console.error("Login error:", error);
      return { error: error.message };
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
