
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [isEmailSubmitted, setIsEmailSubmitted] = useState(false);
  const [otp, setOtp] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  // In a real app, this would send an OTP to the user's email
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Simulate sending OTP
    toast.success("Verification code sent to your email");
    setIsEmailSubmitted(true);
    
    // In a real app, you would send an actual OTP to the email
    console.log("OTP code for demo: 123456");
  };

  // In a real app, this would verify the OTP with your backend
  const handleOtpVerify = () => {
    // For demo purposes, any 6-digit code works
    if (otp.length === 6) {
      login(email);
      toast.success("Login successful!");
      navigate('/work-orders');
    } else {
      toast.error("Please enter a valid 6-digit code");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="bg-navy-800 py-8">
        <div className="container mx-auto px-4">
          <Heading className="text-white text-center">
            {isEmailSubmitted ? "Enter Verification Code" : "Login to Submit Work Order"}
          </Heading>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-md mx-auto my-8">
          <Card>
            <CardHeader>
              <CardTitle>
                {isEmailSubmitted ? "Verify Your Email" : "Login"}
              </CardTitle>
              <CardDescription>
                {isEmailSubmitted 
                  ? "Enter the 6-digit code sent to your email" 
                  : "Enter your email address to receive a one-time login code"}
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
                    />
                  </div>
                  <Button type="submit" className="w-full">Get Verification Code</Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification Code</Label>
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button onClick={handleOtpVerify} className="w-full">Verify</Button>
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
