
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useEffect } from "react";

interface ProtectedRouteProps {
  redirectTo?: string;
}

export const ProtectedRoute = ({ redirectTo = "/login" }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to access this page");
    }
  }, [isAuthenticated]);

  return isAuthenticated ? 
    <Outlet /> : 
    <Navigate to={redirectTo} state={{ from: location }} replace />;
};
