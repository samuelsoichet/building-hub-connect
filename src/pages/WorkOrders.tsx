import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image, Plus, Eye, Loader2, Clock, CheckCircle, AlertCircle, XCircle, Wrench, FileText } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { createWorkOrder, fetchWorkOrders, getStatusInfo, getPriorityInfo } from "@/services/work-order-service";
import type { WorkOrder, WorkOrderPriority } from "@/types/supabase-custom";
import { 
  getAttachmentType, 
  processFileForUpload, 
  isSupportedFileType, 
  isValidFileSize,
  formatFileSize,
  MAX_FILE_SIZE,
  type AttachmentType 
} from "@/utils/file-utils";

const WorkOrders = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    priority: "" as WorkOrderPriority | "",
  });

  const [attachedFiles, setAttachedFiles] = useState<Array<{
    file: File;
    preview: string | null;
    type: AttachmentType;
  }>>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILES = 5;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");

  // Load work orders on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadWorkOrders();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadWorkOrders = async () => {
    setIsLoading(true);
    try {
      const orders = await fetchWorkOrders();
      setWorkOrders(orders);
    } catch (error) {
      console.error("Error loading work orders:", error);
      toast.error("Failed to load work orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriorityChange = (value: string) => {
    setFormData((prev) => ({ ...prev, priority: value as WorkOrderPriority }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processAndAddFiles(Array.from(files));
    }
  };

  const processAndAddFiles = async (files: File[]) => {
    // Check max files limit
    if (attachedFiles.length + files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed. You can add ${MAX_FILES - attachedFiles.length} more.`);
      return;
    }

    setIsProcessingFile(true);
    
    try {
      const newAttachments: typeof attachedFiles = [];
      
      for (const file of files) {
        // Validate file type
        if (!isSupportedFileType(file)) {
          toast.error(`"${file.name}" is not supported. Please upload images or PDFs.`);
          continue;
        }

        // Validate file size
        if (!isValidFileSize(file)) {
          toast.error(`"${file.name}" is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`);
          continue;
        }

        // Process file (converts HEIC to JPEG if needed)
        const processedFile = await processFileForUpload(file);
        const fileType = getAttachmentType(processedFile);
        
        // Generate preview for images
        let preview: string | null = null;
        if (fileType === 'image') {
          preview = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(processedFile);
          });
        } else if (fileType === 'pdf') {
          preview = 'pdf';
        }

        newAttachments.push({
          file: processedFile,
          preview,
          type: fileType,
        });
      }

      setAttachedFiles((prev) => [...prev, ...newAttachments]);
    } catch (error: any) {
      toast.error(error.message || "Failed to process files");
    } finally {
      setIsProcessingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processAndAddFiles(Array.from(files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      priority: "",
    });
    setAttachedFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.location || !formData.priority) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Extract files from attachedFiles
      const files = attachedFiles.map((a) => a.file);
      
      const result = await createWorkOrder(
        {
          title: formData.title,
          description: formData.description,
          location: formData.location,
          priority: formData.priority as WorkOrderPriority,
        },
        files.length > 0 ? files : undefined
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Work order submitted successfully!");
      resetForm();
      setActiveTab("list");
      loadWorkOrders();
    } catch (error: any) {
      console.error("Error submitting work order:", error);
      toast.error("Failed to submit work order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: WorkOrder['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'quote_provided':
        return <AlertCircle className="h-4 w-4" />;
      case 'quote_rejected':
        return <XCircle className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Wrench className="h-4 w-4" />;
      case 'completed':
        return <AlertCircle className="h-4 w-4" />;
      case 'signed_off':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="bg-navy-800 py-8">
        <div className="container mx-auto px-4">
          <Heading className="text-white text-center">Work Orders</Heading>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              My Work Orders
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Submit New Request
            </TabsTrigger>
          </TabsList>
          
          {/* Work Order List Tab */}
          <TabsContent value="list">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : workOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <Wrench className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Work Orders Yet</h3>
                  <p className="text-gray-500 mb-4">
                    You haven't submitted any maintenance requests.
                  </p>
                  <Button onClick={() => setActiveTab("new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Your First Request
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {workOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  const priorityInfo = getPriorityInfo(order.priority);
                  
                  return (
                    <Card 
                      key={order.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/work-orders/${order.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{order.title}</h3>
                              <Badge className={`${priorityInfo.bgColor} ${priorityInfo.color}`}>
                                {priorityInfo.label}
                              </Badge>
                            </div>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                              {order.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>📍 {order.location}</span>
                              <span>🕐 {formatDate(order.created_at)}</span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Badge 
                              variant="outline" 
                              className={`${statusInfo.bgColor} ${statusInfo.color} flex items-center gap-1`}
                            >
                              {getStatusIcon(order.status)}
                              {statusInfo.label}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Show action needed indicator */}
                        {order.status === 'completed' && (
                          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                            <p className="text-sm text-orange-700 font-medium">
                              ⚠️ Action Required: Please review and sign off on completed work
                            </p>
                          </div>
                        )}
                        {order.status === 'quote_provided' && (
                          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                            <p className="text-sm text-orange-700 font-medium">
                              ⚠️ Quote provided - Please review and approve to proceed
                              {order.quoted_amount && ` (${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.quoted_amount)})`}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          {/* New Work Order Form Tab */}
          <TabsContent value="new">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Request Form</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Issue Title *</Label>
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
                    <Label htmlFor="description">Description of Issue *</Label>
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
                      <Label htmlFor="location">Location *</Label>
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
                      <Label htmlFor="priority">Priority Level *</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={handlePriorityChange}
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
                  
                  {/* Photo/Document Upload Section */}
                  <div className="space-y-2">
                    <Label htmlFor="photo">
                      Upload Photos or Documents (Optional) 
                      <span className="text-muted-foreground ml-1">
                        ({attachedFiles.length}/{MAX_FILES})
                      </span>
                    </Label>
                    
                    {/* File previews grid */}
                    {attachedFiles.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                        {attachedFiles.map((attachment, index) => (
                          <div 
                            key={index} 
                            className="relative border rounded-lg p-2 bg-muted/30"
                          >
                            {attachment.type === 'pdf' ? (
                              <div className="flex flex-col items-center py-2">
                                <FileText className="h-10 w-10 text-red-500 mb-1" />
                                <p className="text-xs font-medium truncate w-full text-center">
                                  {attachment.file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(attachment.file.size)}
                                </p>
                              </div>
                            ) : (
                              <div className="aspect-square relative">
                                <img 
                                  src={attachment.preview || ''} 
                                  alt={`Preview ${index + 1}`} 
                                  className="w-full h-full object-cover rounded" 
                                />
                              </div>
                            )}
                            <Button 
                              type="button"
                              variant="destructive" 
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full" 
                              onClick={() => handleRemoveFile(index)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Drop zone */}
                    {attachedFiles.length < MAX_FILES && (
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-md p-4"
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDrop={handleDrop}
                      >
                        <div className="flex flex-col items-center">
                          {isProcessingFile ? (
                            <div className="flex flex-col items-center py-4">
                              <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                              <p className="text-sm text-muted-foreground">Processing files...</p>
                            </div>
                          ) : (
                            <>
                              <div className="flex gap-2 mb-2">
                                <Image className="h-8 w-8 text-gray-400" />
                                <FileText className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500 text-center">
                                Drag and drop files, or click to browse
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Supports: JPEG, PNG, HEIC, PDF (max 10MB each, up to {MAX_FILES} files)
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
                                disabled={isProcessingFile}
                              >
                                <Plus className="mr-2" size={16} />
                                Add Files
                              </Button>
                              <Input
                                id="file-upload"
                                type="file"
                                accept="image/*,.heic,.heif,application/pdf"
                                className="sr-only"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                multiple
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Adding photos or documents helps our maintenance team better understand and address the issue.
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={resetForm}
                    >
                      Clear Form
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Work Order"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default WorkOrders;
