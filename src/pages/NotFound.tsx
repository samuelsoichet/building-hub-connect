
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <Building2 className="h-16 w-16 text-navy-600 mb-4" />
      <h1 className="text-4xl font-bold mb-4 text-navy-800">404 - Page Not Found</h1>
      <p className="text-xl text-gray-600 mb-8 text-center max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <a href="/">Return to Home</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/work-orders">Submit a Work Order</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
