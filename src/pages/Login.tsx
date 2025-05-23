
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
import { Loader2 } from "lucide-react";

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
    console.log("Form submitted with email:", email);
    
    // Trim email to remove any whitespace
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      toast.error("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Attempting login with email:", trimmedEmail);
      const { error } = await login(trimmedEmail);
      
      if (error) {
        console.error("Login error:", error);
        toast.error(error || "Failed to send login link");
      } else {
        setIsEmailSubmitted(true);
        toast.success("Login link sent! Please check your email");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err.message || "Failed to send login link");
    } finally {
      setIsLoading(false);
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
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-navy-700 hover:bg-navy-800 text-white" 
                    disabled={isLoading}
                    onClick={(e) => {
                      console.log("Button clicked directly");
                      if (!isLoading) {
                        // This is a backup in case the form submit event is not firing
                        // We'll still use the form's onSubmit as the primary handler
                        handleEmailSubmit(e);
                      }
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Login Link"
                    )}
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
                    disabled={isLoading}
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
