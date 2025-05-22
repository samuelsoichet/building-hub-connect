
import { Button } from "@/components/ui/button";
import {
  Building2,
  FileText,
  Menu,
  User,
  WrenchIcon
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-navy-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Building2 className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold">PropertyPortal</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/work-orders" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-navy-700 transition-colors">
              Work Orders
            </Link>
            <Link to="/documents" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-navy-700 transition-colors">
              Documents
            </Link>
            <Link to="/payments" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-navy-700 transition-colors">
              Payments
            </Link>
            <Button variant="outline" size="sm" className="ml-4">
              <User className="mr-2 h-4 w-4" /> Login
            </Button>
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
            <Link to="/work-orders" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-navy-700 transition-colors">
              Work Orders
            </Link>
            <Link to="/documents" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-navy-700 transition-colors">
              Documents
            </Link>
            <Link to="/payments" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-navy-700 transition-colors">
              Payments
            </Link>
            <Button variant="outline" size="sm" className="w-full mt-2">
              <User className="mr-2 h-4 w-4" /> Login
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
