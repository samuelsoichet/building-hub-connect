import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from '@supabase/supabase-js';
import { toast } from "sonner";

// Add role type
type UserRole = 'admin' | 'tenant' | 'maintenance';

interface AuthContextType {
  isAuthenticated: boolean;
  email: string | null;
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string) => Promise<{ error?: string }>;
  loginWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  register: (email: string, role?: UserRole) => Promise<{ error?: string }>;
  registerWithPassword: (email: string, password: string, role?: UserRole) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get the application URL based on current environment
const getAppUrl = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return window.location.origin;
  }
  
  return `${window.location.protocol}//${hostname}`;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const initializingRef = useRef<boolean>(false);

  // Function to fetch user role from the database
  const fetchUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role as UserRole || null;
    } catch (err) {
      console.error('Error fetching user role:', err);
      return null;
    }
  };

  // Update auth state from session
  const updateAuthState = async (currentSession: Session | null) => {
    if (currentSession) {
      setIsAuthenticated(true);
      setEmail(currentSession.user?.email || null);
      setUser(currentSession.user);
      setSession(currentSession);

      // Fetch user role using setTimeout to avoid deadlock
      setTimeout(async () => {
        const userRole = await fetchUserRole(currentSession.user.id);
        setRole(userRole);
        localStorage.setItem('auth', JSON.stringify({ 
          isAuthenticated: true, 
          email: currentSession.user?.email,
          role: userRole
        }));
      }, 0);
    } else {
      setIsAuthenticated(false);
      setEmail(null);
      setUser(null);
      setSession(null);
      setRole(null);
      localStorage.removeItem('auth');
    }
  };

  useEffect(() => {
    // Prevent double initialization
    if (initializingRef.current) return;
    initializingRef.current = true;

    // Set up auth state listener FIRST (before checking session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.info(`Auth state changed: ${event}`);
        
        // Only synchronous state updates here
        if (currentSession) {
          setIsAuthenticated(true);
          setEmail(currentSession.user?.email || null);
          setUser(currentSession.user);
          setSession(currentSession);
          
          // Defer async operations to avoid deadlock
          setTimeout(async () => {
            const userRole = await fetchUserRole(currentSession.user.id);
            setRole(userRole);
            localStorage.setItem('auth', JSON.stringify({ 
              isAuthenticated: true, 
              email: currentSession.user?.email,
              role: userRole
            }));
          }, 0);
        } else {
          setIsAuthenticated(false);
          setEmail(null);
          setUser(null);
          setSession(null);
          setRole(null);
          localStorage.removeItem('auth');
        }
        
        // Mark loading as complete after first auth state change
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    const initAuth = async () => {
      try {
        console.log("Checking for existing session...");
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setIsLoading(false);
          return;
        }
        
        if (currentSession) {
          console.log("Found existing session");
          await updateAuthState(currentSession);
        } else {
          console.log("No existing session found");
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error during auth initialization:", error);
        setIsLoading(false);
      }
    };

    // Use a small delay to ensure auth state listener is ready
    const timeoutId = setTimeout(() => {
      initAuth();
    }, 100);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const login = async (email: string) => {
    try {
      console.log("Starting magic link login for:", email);
      const redirectTo = `${getAppUrl()}/auth/callback`;
      console.log(`Setting redirect URL to: ${redirectTo}`);
      
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

  const loginWithPassword = async (email: string, password: string) => {
    try {
      console.log("Starting password login for:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        console.error('Password login error:', error);
        return { error: error.message };
      }
      
      console.log("Password sign-in successful", data);
      return {};
    } catch (error: any) {
      console.error("Password login error:", error);
      return { error: error.message || "Failed to sign in" };
    }
  };

  const register = async (email: string, selectedRole: UserRole = 'tenant') => {
    try {
      console.log("Starting magic link registration for:", email, "with role:", selectedRole);
      const redirectTo = `${getAppUrl()}/auth/callback`;
      console.log(`Setting redirect URL to: ${redirectTo}`);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        }
      });
      
      if (error) {
        console.error('Registration error:', error);
        return { error: error.message };
      }
      
      console.log("Registration initiated successfully", data);
      return {};
    } catch (error: any) {
      console.error("Registration error:", error);
      return { error: error.message || "Failed to send registration link" };
    }
  };

  const registerWithPassword = async (email: string, password: string, selectedRole: UserRole = 'tenant') => {
    try {
      console.log("Starting password registration for:", email, "with role:", selectedRole);
      const redirectTo = `${getAppUrl()}/auth/callback`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            role: selectedRole,
          }
        }
      });
      
      if (error) {
        console.error('Password registration error:', error);
        return { error: error.message };
      }
      
      console.log("Password registration successful", data);
      return {};
    } catch (error: any) {
      console.error("Password registration error:", error);
      return { error: error.message || "Failed to create account" };
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

  // Show loading spinner during initial auth check
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      email, 
      user, 
      session, 
      role,
      isLoading,
      login,
      loginWithPassword,
      logout, 
      register,
      registerWithPassword,
    }}>
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
