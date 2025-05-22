
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

const WorkOrders = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    priority: "",
    name: "",
    email: "",
    phone: "",
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriorityChange = (value: string) => {
    setFormData((prev) => ({ ...prev, priority: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Work order submitted:", formData);
    setSubmitted(true);
    // In a real app, you would send this data to your backend
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="bg-navy-800 py-8">
        <div className="container mx-auto px-4">
          <Heading className="text-white text-center">Submit a Work Order</Heading>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        {submitted ? (
          <div className="max-w-2xl mx-auto my-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-green-600">Work Order Submitted Successfully!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center mb-4">
                  Thank you for submitting your work order. Our maintenance team has been notified and will address your request as soon as possible.
                </p>
                <p className="text-center mb-6">
                  You will receive updates on the status of your work order via email.
                </p>
                <div className="flex justify-center">
                  <Button onClick={() => setSubmitted(false)}>Submit Another Request</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto my-8">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Request Form</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Issue Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Broken Light Fixture, Leaking Sink, etc."
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description of Issue</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Please provide details about the issue..."
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        placeholder="Suite #, Room #, etc."
                        value={formData.location}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority Level</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={handlePriorityChange}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Not Urgent</SelectItem>
                          <SelectItem value="medium">Medium - Needs Attention</SelectItem>
                          <SelectItem value="high">High - Urgent Issue</SelectItem>
                          <SelectItem value="emergency">Emergency - Immediate Attention</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Contact Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="(123) 456-7890"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit">Submit Work Order</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default WorkOrders;
