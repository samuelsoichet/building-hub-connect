
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [isEmailSubmitted, setIsEmailSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If user is already authenticated, redirect them
  if (isAuthenticated) {
    navigate('/work-orders');
    return null;
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple client-side validation
    if (!email || !email.includes('@') || !email.includes('.')) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    const { error } = await login(email);
    setIsLoading(false);
    
    if (!error) {
      setIsEmailSubmitted(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="bg-navy-800 py-8">
        <div className="container mx-auto px-4">
          <Heading className="text-white text-center">
            {isEmailSubmitted ? "Check Your Email" : "Login to Submit Work Order"}
          </Heading>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-md mx-auto my-8">
          <Card>
            <CardHeader>
              <CardTitle>
                {isEmailSubmitted ? "Check Your Email" : "Login"}
              </CardTitle>
              <CardDescription>
                {isEmailSubmitted 
                  ? "A login link has been sent to your email address" 
                  : "Enter your email address to receive a one-time login link"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isEmailSubmitted ? (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Login Link"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-center text-gray-600">
                    We've sent a magic link to <strong>{email}</strong>
                  </p>
                  <p className="text-center text-gray-600">
                    Click the link in the email to sign in
                  </p>
                  <Button 
                    variant="link" 
                    className="w-full" 
                    onClick={() => setIsEmailSubmitted(false)}
                  >
                    Use a different email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
