
import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-navy-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center">
            <Building2 className="h-6 w-6" />
            <span className="ml-2 text-lg font-bold">TenantPortal</span>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex space-x-6">
              <Link to="/about" className="text-sm hover:text-gray-300">
                About
              </Link>
              <Link to="/contact" className="text-sm hover:text-gray-300">
                Contact
              </Link>
              <Link to="/privacy" className="text-sm hover:text-gray-300">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-4 text-center md:text-left text-sm text-gray-300">
          © {new Date().getFullYear()} TenantPortal. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
