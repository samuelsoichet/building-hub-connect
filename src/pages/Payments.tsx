import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Calendar, Check, Clock, History, Smartphone, Building, Banknote, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createCheckoutSession, checkPaymentStatus, fetchPaymentHistory, fetchTenantBalance } from "@/services/payment-service";
import { useSearchParams } from "react-router-dom";

interface Payment {
  id: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
  receipt_url: string | null;
}

interface TenantBalance {
  current_balance: number;
  rent_amount: number;
  next_payment_due: string | null;
  last_payment_date: string | null;
  suite_number: string | null;
}

const Payments = () => {
  const [paymentAmount, setPaymentAmount] = useState("2500.00");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [venmoUsername, setVenmoUsername] = useState("");
  const [zelleEmail, setZelleEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [wireTransferType, setWireTransferType] = useState("domestic");
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [tenantBalance, setTenantBalance] = useState<TenantBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Check for successful payment return from Stripe
  useEffect(() => {
    const success = searchParams.get("success");
    const sessionId = searchParams.get("session_id");
    const paymentId = searchParams.get("payment_id");
    
    if (success === "true" && sessionId && paymentId) {
      // Verify the payment status with our backend
      const verifyPayment = async () => {
        try {
          const result = await checkPaymentStatus(sessionId, paymentId);
          if (result?.payment?.status === "paid") {
            toast.success("Payment successful! Thank you for your payment.");
            setPaymentSubmitted(true);
            // Refresh payment history and balance
            loadPaymentData();
          }
        } catch (error) {
          console.error("Error verifying payment:", error);
        }
      };
      
      verifyPayment();
    } else if (success === "false") {
      toast.error("Payment was cancelled or unsuccessful. Please try again.");
    }
  }, [searchParams]);
  
  // Load payment history and tenant balance on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadPaymentData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);
  
  const loadPaymentData = async () => {
    setIsLoading(true);
    try {
      // Load payment history
      const payments = await fetchPaymentHistory();
      setPaymentHistory(payments || []);
      
      // Load tenant balance
      const balance = await fetchTenantBalance();
      setTenantBalance(balance);
    } catch (error) {
      console.error("Error loading payment data:", error);
      toast.error("Failed to load payment information. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate the credit card fee
  const calculateCreditCardFee = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "0.00";
    return (numAmount * 0.035).toFixed(2);
  };
  
  const creditCardFee = calculateCreditCardFee(paymentAmount);
  const totalWithFee = (parseFloat(paymentAmount) + parseFloat(creditCardFee)).toFixed(2);
  
  // Mock upcoming payments based on tenant balance
  const getUpcomingPayments = () => {
    if (!tenantBalance || !tenantBalance.rent_amount) return [];
    
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    nextMonth.setDate(1); // First day of next month
    
    const twoMonthsLater = new Date(nextMonth);
    twoMonthsLater.setMonth(nextMonth.getMonth() + 1);
    
    return [
      {
        id: 1,
        dueDate: nextMonth.toISOString().split('T')[0],
        amount: tenantBalance.rent_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        description: `Monthly Rent - ${nextMonth.toLocaleString('default', { month: 'long' })} ${nextMonth.getFullYear()}`
      },
      {
        id: 2,
        dueDate: twoMonthsLater.toISOString().split('T')[0],
        amount: tenantBalance.rent_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        description: `Monthly Rent - ${twoMonthsLater.toLocaleString('default', { month: 'long' })} ${twoMonthsLater.getFullYear()}`
      }
    ];
  };
  
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error("You must be logged in to make a payment.");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const amountNum = parseFloat(paymentAmount);
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error("Please enter a valid payment amount");
        return;
      }
      
      // Create a Stripe Checkout session
      const result = await createCheckoutSession(amountNum, "Rent Payment");
      
      if (result?.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else {
        toast.error("Failed to create payment session. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment processing error. Please try again later.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Display instructions for a specific payment method
  const renderPaymentInstructions = (method: string) => {
    const instructions = {
      zelle: (
        <div className="border rounded-lg p-4 bg-blue-50 mt-4">
          <h3 className="text-lg font-medium mb-2">Zelle Payment Instructions</h3>
          <p className="mb-2">To send a payment via Zelle:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Open your banking app that offers Zelle</li>
            <li>Add recipient using: <span className="font-semibold">payments@propertyportal.com</span></li>
            <li>Enter the exact amount: <span className="font-semibold">${paymentAmount}</span></li>
            <li>In the memo field, include your account number or suite number</li>
            <li>Complete the payment in your banking app</li>
          </ol>
          <p className="mt-2 text-sm">Make payments payable to: <span className="font-semibold">2000 Brooklyn Street LLC</span></p>
          <p className="mt-2 text-sm">Once your payment is sent, please enter the Zelle email you used below for our records.</p>
        </div>
      ),
      venmo: (
        <div className="border rounded-lg p-4 bg-green-50 mt-4">
          <h3 className="text-lg font-medium mb-2">Venmo Payment Instructions</h3>
          <p className="mb-2">To send a payment via Venmo:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Open your Venmo app</li>
            <li>Search for username: <span className="font-semibold">@BrooklynStreet</span></li>
            <li>Enter the exact amount: <span className="font-semibold">${paymentAmount}</span></li>
            <li>In the description, include your account number or suite number</li>
            <li>Tap "Pay"</li>
          </ol>
          <p className="mt-2 text-sm">Make payments payable to: <span className="font-semibold">2000 Brooklyn Street LLC</span></p>
          <p className="mt-2 text-sm">After sending payment, please enter your Venmo username below for our records.</p>
        </div>
      ),
      ach: (
        <div className="border rounded-lg p-4 bg-gray-50 mt-4">
          <h3 className="text-lg font-medium mb-2">ACH Transfer Instructions</h3>
          <p className="mb-2">To send a payment via ACH transfer, use the following details:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
            <div className="text-sm">Bank Name:</div>
            <div className="font-medium">First National Bank</div>
            <div className="text-sm">Account Name:</div>
            <div className="font-medium">2000 Brooklyn Street LLC</div>
            <div className="text-sm">Routing Number:</div>
            <div className="font-medium">021000021</div>
            <div className="text-sm">Account Number:</div>
            <div className="font-medium">9876543210</div>
            <div className="text-sm">Account Type:</div>
            <div className="font-medium">Business Checking</div>
          </div>
          <p className="mt-4 text-sm">Please include your account/suite number in the memo field.</p>
        </div>
      ),
      wire: (
        <div className="border rounded-lg p-4 bg-amber-50 mt-4">
          <h3 className="text-lg font-medium mb-2">Wire Transfer Instructions</h3>
          <p className="mb-2">To send a payment via wire transfer, use the following details:</p>
          
          <RadioGroup 
            value={wireTransferType}
            onValueChange={(value) => setWireTransferType(value)} 
            className="flex gap-4 my-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="domestic" id="domestic"/>
              <Label htmlFor="domestic">Domestic Wire</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="international" id="international"/>
              <Label htmlFor="international">International Wire</Label>
            </div>
          </RadioGroup>
          
          {wireTransferType === "domestic" ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
              <div className="text-sm">Bank Name:</div>
              <div className="font-medium">First National Bank</div>
              <div className="text-sm">Account Name:</div>
              <div className="font-medium">2000 Brooklyn Street LLC</div>
              <div className="text-sm">Routing (ABA) Number:</div>
              <div className="font-medium">021000021</div>
              <div className="text-sm">Account Number:</div>
              <div className="font-medium">9876543210</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
              <div className="text-sm">Bank Name:</div>
              <div className="font-medium">First National Bank</div>
              <div className="text-sm">Account Name:</div>
              <div className="font-medium">2000 Brooklyn Street LLC</div>
              <div className="text-sm">SWIFT Code:</div>
              <div className="font-medium">FNBCUS33</div>
              <div className="text-sm">Account Number (IBAN):</div>
              <div className="font-medium">US98765432109876543210</div>
              <div className="text-sm">Bank Address:</div>
              <div className="font-medium">123 Finance St, New York, NY 10001</div>
            </div>
          )}
          <p className="mt-4 text-sm italic">Please include your account/suite number in the wire reference field.</p>
        </div>
      )
    };
    
    return instructions[method as keyof typeof instructions];
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };
  
  // Format currency for display
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 2 
    });
  };
  
  // Get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'destructive';
      case 'expired':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="bg-navy-800 py-8">
        <div className="container mx-auto px-4">
          <Heading className="text-white text-center">Payment Portal</Heading>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading payment information...</span>
          </div>
        ) : !isAuthenticated ? (
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="mb-6">Please sign in to access the payment portal.</p>
            <Button asChild>
              <a href="/login">Sign In</a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Make a Payment</CardTitle>
                  <CardDescription>
                    Securely pay your rent or other fees online
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentSubmitted ? (
                    <div className="text-center py-8">
                      <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                        <Check className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
                      <p className="text-gray-600 mb-6">
                        Your payment of ${paymentAmount} has been processed successfully.
                        A receipt has been sent to your email.
                      </p>
                      <Button onClick={() => setPaymentSubmitted(false)}>
                        Make Another Payment
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitPayment}>
                      <Tabs defaultValue="card" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                          <TabsTrigger value="card">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Credit Card
                            <Badge variant="destructive" className="ml-1 text-[10px]">+3.5%</Badge>
                          </TabsTrigger>
                          <TabsTrigger value="zelle">
                            <Smartphone className="h-4 w-4 mr-2" />
                            Zelle
                          </TabsTrigger>
                          <TabsTrigger value="venmo">
                            <Smartphone className="h-4 w-4 mr-2" />
                            Venmo
                          </TabsTrigger>
                          <TabsTrigger value="ach">
                            <Building className="h-4 w-4 mr-2" />
                            ACH Transfer
                          </TabsTrigger>
                          <TabsTrigger value="wire">
                            <Banknote className="h-4 w-4 mr-2" />
                            Wire Transfer
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="card" className="space-y-4 pt-4">
                          <div className="rounded-md bg-yellow-50 p-4 mb-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <CreditCard className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                              </div>
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">Credit Card Fee Notice</h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                  <p>A 3.5% processing fee will be added to all credit card transactions.</p>
                                  <div className="mt-2 font-medium">
                                    <p>Payment Amount: ${paymentAmount}</p>
                                    <p>Processing Fee (3.5%): ${creditCardFee}</p>
                                    <p>Total Amount: ${totalWithFee}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-gray-500 mb-4">
                            When you click "Make Payment", you'll be redirected to Stripe's secure payment page to complete your transaction.
                          </p>
                        </TabsContent>
                        
                        <TabsContent value="zelle" className="space-y-4 pt-4">
                          {renderPaymentInstructions("zelle")}
                          <div className="space-y-2 mt-4">
                            <Label htmlFor="zelle-email">Your Zelle Email/Phone</Label>
                            <Input 
                              id="zelle-email" 
                              placeholder="email@example.com" 
                              value={zelleEmail}
                              onChange={(e) => setZelleEmail(e.target.value)}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              This helps us track your payment in our system
                            </p>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="venmo" className="space-y-4 pt-4">
                          {renderPaymentInstructions("venmo")}
                          <div className="space-y-2 mt-4">
                            <Label htmlFor="venmo-username">Your Venmo Username</Label>
                            <Input 
                              id="venmo-username" 
                              placeholder="@username" 
                              value={venmoUsername}
                              onChange={(e) => setVenmoUsername(e.target.value)}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              This helps us track your payment in our system
                            </p>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="ach" className="space-y-4 pt-4">
                          {renderPaymentInstructions("ach")}
                          <div className="space-y-4 mt-4 border-t pt-4">
                            <p className="font-medium">Record your ACH transfer details</p>
                            <div className="space-y-2">
                              <Label htmlFor="bank-name">Your Bank Name</Label>
                              <Input 
                                id="bank-name" 
                                placeholder="Enter your bank name" 
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="routing-number">Your Routing Number</Label>
                                <Input 
                                  id="routing-number" 
                                  placeholder="9 digits" 
                                  value={routingNumber}
                                  onChange={(e) => setRoutingNumber(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="account-number">Last 4 of Account</Label>
                                <Input 
                                  id="account-number" 
                                  placeholder="Last 4 digits" 
                                  value={accountNumber}
                                  onChange={(e) => setAccountNumber(e.target.value)}
                                  maxLength={4}
                                />
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="wire" className="pt-4">
                          {renderPaymentInstructions("wire")}
                          <div className="space-y-4 mt-4 border-t pt-4">
                            <p className="font-medium">Record your wire transfer details</p>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="wire-bank">Your Bank Name</Label>
                                <Input id="wire-bank" placeholder="Enter your bank name" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="wire-date">Transfer Date</Label>
                                <Input id="wire-date" type="date" defaultValue={paymentDate} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="wire-reference">Reference/Confirmation Number</Label>
                              <Input id="wire-reference" placeholder="Enter reference or confirmation number" />
                              <p className="text-sm text-gray-500 mt-1">
                                This helps us track your payment in our system
                              </p>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      <Separator className="my-6" />
                      
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="payment-amount">Payment Amount ($)</Label>
                          <Input
                            id="payment-amount"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="payment-date">Payment Date</Label>
                          <Input
                            id="payment-date"
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="payment-memo">Memo (Optional)</Label>
                          <Input id="payment-memo" placeholder="May 2024 Rent" />
                        </div>
                      </div>
                    </form>
                  )}
                </CardContent>
                {!paymentSubmitted && (
                  <CardFooter className="flex justify-between">
                    <p className="text-sm text-gray-500">
                      Your payment information is encrypted and secure.
                    </p>
                    <Button 
                      type="submit" 
                      onClick={handleSubmitPayment}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Make Payment
                        </>
                      )}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Current Balance:</span>
                      <span className="font-semibold">
                        {tenantBalance ? formatCurrency(tenantBalance.current_balance) : '$0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Monthly Rent:</span>
                      <span className="font-semibold">
                        {tenantBalance ? formatCurrency(tenantBalance.rent_amount) : '$0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-semibold">
                        {tenantBalance?.next_payment_due ? 
                          formatDate(tenantBalance.next_payment_due) : 
                          'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Suite:</span>
                      <span className="font-semibold">
                        {tenantBalance?.suite_number || 'Not assigned'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Upcoming Payments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Upcoming Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tenantBalance?.rent_amount ? (
                    <div className="space-y-4">
                      {getUpcomingPayments().map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{payment.description}</p>
                            <p className="text-sm text-gray-500">Due: {formatDate(payment.dueDate)}</p>
                          </div>
                          <span className="font-semibold">${payment.amount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-2 text-sm text-gray-500">No upcoming payments</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <History className="mr-2 h-5 w-5" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentHistory.length > 0 ? (
                    <>
                      {paymentHistory.slice(0, 3).map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center mb-3">
                          <div>
                            <p className="font-medium">{payment.description || "Payment"}</p>
                            <p className="text-sm text-gray-500">{formatDate(payment.created_at)}</p>
                          </div>
                          <div className="flex items-center">
                            <span className="font-semibold mr-2">
                              {formatCurrency(payment.amount)}
                            </span>
                            <Badge variant={getStatusBadgeVariant(payment.status)}>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {paymentHistory.length > 3 && (
                        <div className="mt-2 text-center">
                          <Button variant="link" className="text-sm" onClick={() => window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})}>
                            View All Transactions
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-center py-2 text-sm text-gray-500">No transaction history</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {/* Payment History Section */}
        {isAuthenticated && !isLoading && paymentHistory.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.created_at)}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{payment.description || "Payment"}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {payment.receipt_url ? (
                            <Button variant="link" size="sm" asChild>
                              <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer">
                                View Receipt
                              </a>
                            </Button>
                          ) : (
                            <span className="text-gray-500 text-sm">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Payments;
