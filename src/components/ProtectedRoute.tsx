
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

type UserRole = 'admin' | 'tenant' | 'maintenance';

interface ProtectedRouteProps {
  redirectTo?: string;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ 
  redirectTo = "/login",
  allowedRoles
}: ProtectedRouteProps) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();
  const hasShownToast = useRef(false);
  
  useEffect(() => {
    // Only show toast once and only after loading is complete
    if (isLoading || hasShownToast.current) return;
    
    if (!isAuthenticated) {
      hasShownToast.current = true;
      toast.error("Please login to access this page");
    } else if (allowedRoles && role && !allowedRoles.includes(role)) {
      hasShownToast.current = true;
      toast.error("You don't have permission to access this page");
    }
  }, [isAuthenticated, role, allowedRoles, isLoading]);

  // Show loading state while auth is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  // Check if user has required role (if specified)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect based on their role
    if (role === 'tenant' || role === 'maintenance' || role === 'admin') {
      return <Navigate to="/work-orders" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
