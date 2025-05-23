
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
import { CreditCard, Calendar, Check, Clock, History, Smartphone, Building, Banknote } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Payments = () => {
  const [paymentAmount, setPaymentAmount] = useState("2500.00");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [venmoUsername, setVenmoUsername] = useState("");
  const [zelleEmail, setZelleEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [wireTransferType, setWireTransferType] = useState("domestic");
  
  // Mock payment history data
  const paymentHistory = [
    {
      id: 1,
      date: "2024-04-01",
      amount: "2,500.00",
      type: "Rent",
      status: "Paid",
      reference: "INV-2024-04",
    },
    {
      id: 2,
      date: "2024-03-01",
      amount: "2,500.00",
      type: "Rent",
      status: "Paid",
      reference: "INV-2024-03",
    },
    {
      id: 3,
      date: "2024-02-01",
      amount: "2,500.00",
      type: "Rent",
      status: "Paid",
      reference: "INV-2024-02",
    },
    {
      id: 4,
      date: "2024-01-15",
      amount: "350.00",
      type: "Utilities",
      status: "Paid",
      reference: "UTIL-2024-01",
    },
  ];

  // Mock upcoming payments
  const upcomingPayments = [
    {
      id: 1,
      dueDate: "2024-06-01",
      amount: "2,500.00",
      description: "Monthly Rent - June 2024",
    },
    {
      id: 2,
      dueDate: "2024-07-01",
      amount: "2,500.00",
      description: "Monthly Rent - July 2024",
    },
  ];

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would process the payment through a payment gateway
    console.log("Payment submitted:", { amount: paymentAmount, date: paymentDate });
    setPaymentSubmitted(true);
    toast.success("Payment has been successfully submitted");
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
          <p className="mt-2 text-sm">Once your payment is sent, please enter the Zelle email you used below for our records.</p>
        </div>
      ),
      venmo: (
        <div className="border rounded-lg p-4 bg-green-50 mt-4">
          <h3 className="text-lg font-medium mb-2">Venmo Payment Instructions</h3>
          <p className="mb-2">To send a payment via Venmo:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Open your Venmo app</li>
            <li>Search for username: <span className="font-semibold">@PropertyPortal</span></li>
            <li>Enter the exact amount: <span className="font-semibold">${paymentAmount}</span></li>
            <li>In the description, include your account number or suite number</li>
            <li>Tap "Pay"</li>
          </ol>
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
            <div className="font-medium">Property Portal Holdings LLC</div>
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
              <div className="font-medium">Property Portal Holdings LLC</div>
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
              <div className="font-medium">Property Portal Holdings LLC</div>
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="bg-navy-800 py-8">
        <div className="container mx-auto px-4">
          <Heading className="text-white text-center">Payment Portal</Heading>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8 flex-grow">
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
                        <div className="space-y-2">
                          <Label htmlFor="card-number">Card Number</Label>
                          <Input id="card-number" placeholder="•••• •••• •••• ••••" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiry">Expiry Date</Label>
                            <Input id="expiry" placeholder="MM/YY" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cvc">CVC</Label>
                            <Input id="cvc" placeholder="•••" />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="card-name">Cardholder Name</Label>
                          <Input id="card-name" placeholder="Name on card" />
                        </div>
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
                  <Button type="submit" onClick={handleSubmitPayment}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Make Payment
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
                    <span className="font-semibold">$2,500.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-semibold">May 1, 2024</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Suite:</span>
                    <span className="font-semibold">Suite 203</span>
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
                {upcomingPayments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingPayments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{payment.description}</p>
                          <p className="text-sm text-gray-500">Due: {payment.dueDate}</p>
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
                {paymentHistory.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-medium">{payment.type}</p>
                      <p className="text-sm text-gray-500">{payment.date}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold mr-2">${payment.amount}</span>
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="mt-2 text-center">
                  <Button variant="link" className="text-sm">
                    View All Transactions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Payment History Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Amount</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4 hidden md:table-cell">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{payment.date}</td>
                      <td className="py-3 px-4">${payment.amount}</td>
                      <td className="py-3 px-4">{payment.type}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">{payment.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Payments;
