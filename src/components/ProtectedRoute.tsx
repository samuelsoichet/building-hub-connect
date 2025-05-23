
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useEffect } from "react";

type UserRole = 'admin' | 'tenant' | 'maintenance';

interface ProtectedRouteProps {
  redirectTo?: string;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ 
  redirectTo = "/login",
  allowedRoles
}: ProtectedRouteProps) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to access this page");
    } else if (allowedRoles && role && !allowedRoles.includes(role)) {
      toast.error("You don't have permission to access this page");
    }
  }, [isAuthenticated, role, allowedRoles]);

  // First check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  // Then check if user has required role (if specified)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to a different page based on their role
    if (role === 'tenant') {
      return <Navigate to="/work-orders" replace />;
    } else if (role === 'maintenance') {
      return <Navigate to="/work-orders" replace />;
    } else if (role === 'admin') {
      return <Navigate to="/work-orders" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
