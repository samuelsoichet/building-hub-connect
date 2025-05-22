
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Image } from "lucide-react";
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

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriorityChange = (value: string) => {
    setFormData((prev) => ({ ...prev, priority: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Work order submitted:", formData);
    console.log("Photo included:", photoPreview ? "Yes" : "No");
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
                  
                  {/* Photo Upload Section */}
                  <div className="space-y-2">
                    <Label htmlFor="photo">Upload Photo (Optional)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
                      <div className="flex flex-col items-center">
                        {photoPreview ? (
                          <div className="relative w-full">
                            <img 
                              src={photoPreview} 
                              alt="Preview" 
                              className="mx-auto max-h-48 object-contain rounded-md mb-2" 
                            />
                            <Button 
                              type="button"
                              variant="outline" 
                              size="sm"
                              className="absolute top-0 right-0 bg-white" 
                              onClick={() => setPhotoPreview(null)}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Image className="h-10 w-10 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">
                              Drag and drop an image, or click to browse
                            </p>
                          </>
                        )}
                        <div className="mt-4 w-full">
                          <label htmlFor="file-upload" className="w-full">
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="w-full flex items-center justify-center"
                              onClick={() => document.getElementById('file-upload')?.click()}
                            >
                              <Upload className="mr-2" size={16} />
                              {photoPreview ? "Replace Photo" : "Upload Photo"}
                            </Button>
                            <Input
                              id="file-upload"
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Adding a photo helps our maintenance team better understand and address the issue.</p>
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
