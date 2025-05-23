
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { ArrowRight, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-gradient-to-b from-navy-800 to-navy-900 text-white py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <Heading className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6">
            Commercial Building Management Made Simple
          </Heading>
          <p className="text-lg sm:text-xl text-gray-200 mb-8">
            Streamline work orders, manage documents, and process payments all in one place.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-navy-800 hover:bg-gray-100 font-medium"
            >
              <Link to={isAuthenticated ? "/work-orders" : "/login"}>
                {isAuthenticated ? (
                  <>Submit a Work Order <ArrowRight className="ml-2 h-4 w-4" /></>
                ) : (
                  <>Login to Submit a Work Order <LogIn className="ml-2 h-4 w-4" /></>
                )}
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-navy-700 font-medium"
            >
              <Link to="/documents">
                Document Repository
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-navy-700 font-medium"
            >
              <Link to="/payments">
                Make a Payment
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
