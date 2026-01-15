
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  LogIn,
  LogOut,
  Menu,
  User,
  LayoutDashboard,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, email, logout, user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isStaff = role === 'admin' || role === 'maintenance';

  useEffect(() => {
    // Log auth state for debugging
    console.log("Navbar auth state:", { isAuthenticated, email, userId: user?.id, role });
  }, [isAuthenticated, email, user, role]);

  const handleLogout = async () => {
    await logout();
    toast.success("You have been logged out");
    navigate('/');
  };

  const getRoleBadge = () => {
    if (!role) return null;
    const colors: Record<string, string> = {
      admin: 'bg-red-500',
      maintenance: 'bg-purple-500',
      tenant: 'bg-green-500',
    };
    return (
      <Badge className={`${colors[role] || 'bg-gray-500'} text-white text-xs ml-2`}>
        {role}
      </Badge>
    );
  };

  return (
    <nav className="bg-navy-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Building2 className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold">TenantPortal</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isStaff && (
              <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-navy-700 transition-colors flex items-center">
                <LayoutDashboard className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
            )}
            <Link to="/work-orders" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-navy-700 transition-colors">
              Work Orders
            </Link>
            <Link to="/documents" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-navy-700 transition-colors">
              Documents
            </Link>
            <Link to="/payments" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-navy-700 transition-colors">
              Payments
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <span>{email}</span>
                  {getRoleBadge()}
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link to="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-navy-800 border-t border-navy-700">
            {isStaff && (
              <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-navy-700 transition-colors flex items-center">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            )}
            <Link to="/work-orders" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-navy-700 transition-colors">
              Work Orders
            </Link>
            <Link to="/documents" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-navy-700 transition-colors">
              Documents
            </Link>
            <Link to="/payments" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-navy-700 transition-colors">
              Payments
            </Link>
            
            {isAuthenticated ? (
              <>
                <div className="px-3 py-2 text-sm flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <span>{email}</span>
                  {getRoleBadge()}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/login">
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
