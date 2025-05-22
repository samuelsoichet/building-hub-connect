
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Calendar, Check, Clock, History } from "lucide-react";
import { useState } from "react";

const Payments = () => {
  const [paymentAmount, setPaymentAmount] = useState("2500.00");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  
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
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="card">Credit Card</TabsTrigger>
                        <TabsTrigger value="bank">Bank Account</TabsTrigger>
                        <TabsTrigger value="other">Other Methods</TabsTrigger>
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
                      
                      <TabsContent value="bank" className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="bank-name">Bank Name</Label>
                          <Input id="bank-name" placeholder="Enter your bank name" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="routing-number">Routing Number</Label>
                          <Input id="routing-number" placeholder="9 digits" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="account-number">Account Number</Label>
                          <Input id="account-number" placeholder="Enter account number" />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="other" className="pt-4">
                        <p className="text-center py-4">
                          Other payment methods are coming soon. Please use credit card or bank account options for now.
                        </p>
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
