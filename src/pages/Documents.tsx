
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EyeIcon, FileText, SearchIcon, DownloadIcon } from "lucide-react";
import { useState } from "react";

// Mock document data - in a real app this would come from your database
const documents = [
  {
    id: 1,
    title: "Master Lease Agreement",
    type: "lease",
    category: "Lease Documents",
    dateAdded: "2023-10-15",
    size: "1.2 MB",
  },
  {
    id: 2,
    title: "Building Rules and Regulations",
    type: "policy",
    category: "Policies",
    dateAdded: "2023-09-01",
    size: "450 KB",
  },
  {
    id: 3,
    title: "Rental Payment Schedule",
    type: "payment",
    category: "Payment Documents",
    dateAdded: "2024-01-10",
    size: "320 KB",
  },
  {
    id: 4,
    title: "Lease Addendum - Parking",
    type: "lease",
    category: "Lease Documents",
    dateAdded: "2023-11-22",
    size: "280 KB",
  },
  {
    id: 5,
    title: "Insurance Requirements",
    type: "policy",
    category: "Policies",
    dateAdded: "2023-08-15",
    size: "540 KB",
  },
  {
    id: 6,
    title: "Building Access Instructions",
    type: "policy",
    category: "Policies",
    dateAdded: "2023-12-05",
    size: "380 KB",
  },
  {
    id: 7,
    title: "Suite Modification Guidelines",
    type: "policy",
    category: "Policies",
    dateAdded: "2024-02-20",
    size: "650 KB",
  },
  {
    id: 8,
    title: "Payment Receipt - January 2024",
    type: "payment",
    category: "Payment Documents",
    dateAdded: "2024-01-05",
    size: "210 KB",
  },
];

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Filter documents based on search term and active tab
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || doc.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="bg-navy-800 py-8">
        <div className="container mx-auto px-4">
          <Heading className="text-white text-center">Document Repository</Heading>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Card className="my-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle>Your Documents</CardTitle>
              <div className="relative w-full md:w-64">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="pl-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Documents</TabsTrigger>
                <TabsTrigger value="lease">Leases</TabsTrigger>
                <TabsTrigger value="policy">Policies</TabsTrigger>
                <TabsTrigger value="payment">Payments</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-4">
                {filteredDocs.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2 text-gray-500">No documents found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Document Name</th>
                          <th className="text-left py-3 px-4">Category</th>
                          <th className="text-left py-3 px-4 hidden md:table-cell">Date Added</th>
                          <th className="text-left py-3 px-4 hidden md:table-cell">Size</th>
                          <th className="text-right py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocs.map((doc) => (
                          <tr key={doc.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-navy-600" />
                              {doc.title}
                            </td>
                            <td className="py-3 px-4">{doc.category}</td>
                            <td className="py-3 px-4 hidden md:table-cell">{doc.dateAdded}</td>
                            <td className="py-3 px-4 hidden md:table-cell">{doc.size}</td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" title="View Document">
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Download Document">
                                  <DownloadIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="my-8">
          <CardHeader>
            <CardTitle>Document Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              Need a document that's not listed here? Submit a request to our property management team.
            </p>
            <div className="flex justify-center">
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Request Document
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Documents;
