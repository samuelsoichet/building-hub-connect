import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Loader2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Wrench,
  Camera,
  MessageSquare,
  Star,
  User,
  Calendar,
  MapPin,
  AlertTriangle,
  Pencil,
  Check,
  X,
  FileText,
  Trash2,
  Plus,
  History,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchWorkOrderWithDetails, 
  approveWorkOrder,
  rejectWorkOrder,
  startWorkOrder,
  completeWorkOrder,
  signOffWorkOrder,
  addWorkOrderComment,
  uploadWorkOrderPhoto,
  updateWorkOrderField,
  deleteWorkOrderPhoto,
  fetchWorkOrderHistory,
  provideQuote,
  approveQuote,
  rejectQuote,
  getStatusInfo, 
  getPriorityInfo 
} from "@/services/work-order-service";
import type { WorkOrder, WorkOrderPhoto, WorkOrderComment, WorkOrderHistory } from "@/types/supabase-custom";
import { InlineEdit } from "@/components/InlineEdit";
import { 
  processFileForUpload, 
  isSupportedFileType, 
  isValidFileSize 
} from "@/utils/file-utils";

const WorkOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [photos, setPhotos] = useState<WorkOrderPhoto[]>([]);
  const [comments, setComments] = useState<WorkOrderComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form states
  const [newComment, setNewComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionPhoto, setCompletionPhoto] = useState<File | null>(null);
  const [completionPhotoPreview, setCompletionPhotoPreview] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [signature, setSignature] = useState("");
  
  // Dialog states
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showSignOffDialog, setShowSignOffDialog] = useState(false);
  const [showQuoteRejectDialog, setShowQuoteRejectDialog] = useState(false);
  
  // Quote workflow states
  const [jobSize, setJobSize] = useState<'small' | 'large'>('small');
  const [quotedAmount, setQuotedAmount] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteRejectionReason, setQuoteRejectionReason] = useState("");
  
  // Photo upload states
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // Priority editing
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [editedPriority, setEditedPriority] = useState("");
  const [isSavingPriority, setIsSavingPriority] = useState(false);
  
  // History
  const [history, setHistory] = useState<WorkOrderHistory[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  useEffect(() => {
    if (id) {
      loadWorkOrder();
      loadHistory();
    }
  }, [id]);

  const loadWorkOrder = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const data = await fetchWorkOrderWithDetails(id);
      setWorkOrder(data.workOrder);
      setPhotos(data.photos);
      setComments(data.comments);
    } catch (error) {
      console.error("Error loading work order:", error);
      toast.error("Failed to load work order");
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!id) return;
    try {
      const historyData = await fetchWorkOrderHistory(id);
      setHistory(historyData);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const handleProvideQuote = async () => {
    if (!id) return;
    
    if (jobSize === 'large' && (!quotedAmount || parseFloat(quotedAmount) <= 0)) {
      toast.error("Please enter a valid quoted amount for large jobs");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const result = await provideQuote(id, {
        jobSize,
        quotedAmount: jobSize === 'large' ? parseFloat(quotedAmount) : undefined,
        quoteNotes: quoteNotes || undefined,
      });
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      toast.success(jobSize === 'small' ? "Work order approved!" : "Quote sent to tenant!");
      setJobSize('small');
      setQuotedAmount("");
      setQuoteNotes("");
      loadWorkOrder();
    } catch (error) {
      toast.error("Failed to process work order");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveQuote = async () => {
    if (!id) return;
    setIsProcessing(true);
    
    try {
      const result = await approveQuote(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Quote approved! Work will begin soon.");
      loadWorkOrder();
    } catch (error) {
      toast.error("Failed to approve quote");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!id) return;
    setIsProcessing(true);
    
    try {
      const result = await rejectQuote(id, quoteRejectionReason || undefined);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Quote rejected");
      setShowQuoteRejectDialog(false);
      setQuoteRejectionReason("");
      loadWorkOrder();
    } catch (error) {
      toast.error("Failed to reject quote");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setIsProcessing(true);
    
    try {
      const result = await approveWorkOrder(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Work order approved!");
      loadWorkOrder();
    } catch (error) {
      toast.error("Failed to approve work order");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setIsProcessing(true);
    
    try {
      const result = await rejectWorkOrder(id, rejectionReason);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Work order rejected");
      setShowRejectDialog(false);
      loadWorkOrder();
    } catch (error) {
      toast.error("Failed to reject work order");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartWork = async () => {
    if (!id) return;
    setIsProcessing(true);
    
    try {
      const result = await startWorkOrder(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Work started!");
      loadWorkOrder();
    } catch (error) {
      toast.error("Failed to start work");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!id || !completionNotes.trim()) {
      toast.error("Please provide completion notes");
      return;
    }
    setIsProcessing(true);
    
    try {
      const result = await completeWorkOrder(id, completionNotes, completionPhoto || undefined);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Work marked as complete!");
      setShowCompleteDialog(false);
      loadWorkOrder();
    } catch (error) {
      toast.error("Failed to complete work order");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOff = async () => {
    if (!id) return;
    setIsProcessing(true);
    
    try {
      const result = await signOffWorkOrder(id, feedback, rating > 0 ? rating : undefined, signature || undefined);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Work order signed off successfully!");
      setShowSignOffDialog(false);
      loadWorkOrder();
    } catch (error) {
      toast.error("Failed to sign off work order");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddComment = async () => {
    if (!id || !newComment.trim()) return;
    
    try {
      const result = await addWorkOrderComment(id, newComment);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setNewComment("");
      loadWorkOrder();
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleCompletionPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompletionPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompletionPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isStaff = role === 'admin' || role === 'maintenance';
  const isOwner = workOrder?.tenant_id === user?.id;
  
  // Can edit if staff OR (owner AND status is pending)
  const canEdit = isStaff || (isOwner && workOrder?.status === 'pending');

  // Field update handlers
  const handleUpdateField = async (field: 'title' | 'location' | 'description', value: string) => {
    if (!id) return;
    const result = await updateWorkOrderField(id, field, value);
    if (result.error) {
      toast.error(result.error);
      throw new Error(result.error);
    }
    toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated`);
    loadWorkOrder();
    loadHistory();
  };

  const handleSavePriority = async () => {
    if (!id || !editedPriority) return;
    
    setIsSavingPriority(true);
    try {
      const result = await updateWorkOrderField(id, 'priority', editedPriority);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Priority updated");
      setIsEditingPriority(false);
      loadWorkOrder();
      loadHistory();
    } catch (error) {
      toast.error("Failed to update priority");
    } finally {
      setIsSavingPriority(false);
    }
  };

  // Format field name for display
  const formatFieldName = (field: string) => {
    return field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
  };

  const handleStartEditPriority = () => {
    if (workOrder) {
      setEditedPriority(workOrder.priority);
      setIsEditingPriority(true);
    }
  };

  // Photo management handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !id) return;

    setIsUploadingPhoto(true);
    try {
      for (const file of Array.from(files)) {
        if (!isSupportedFileType(file)) {
          toast.error(`Unsupported file type: ${file.name}`);
          continue;
        }
        if (!isValidFileSize(file)) {
          toast.error(`File too large: ${file.name} (max 10MB)`);
          continue;
        }

        const processedFile = await processFileForUpload(file);
        const result = await uploadWorkOrderPhoto(id, processedFile, 'initial');
        
        if (result.error) {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      toast.success("Photos uploaded successfully");
      loadWorkOrder();
    } catch (error) {
      toast.error("Failed to upload photos");
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    setIsDeletingPhoto(photoId);
    try {
      const result = await deleteWorkOrderPhoto(photoId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Photo deleted");
      loadWorkOrder();
    } catch (error) {
      toast.error("Failed to delete photo");
    } finally {
      setIsDeletingPhoto(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Work Order Not Found</h2>
            <Button onClick={() => navigate('/work-orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Work Orders
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const statusInfo = getStatusInfo(workOrder.status);
  const priorityInfo = getPriorityInfo(workOrder.priority);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="bg-navy-800 py-6">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            className="text-white mb-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Heading className="text-white">Work Order Details</Heading>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  {/* Title - Inline Edit */}
                  <InlineEdit
                    value={workOrder.title}
                    onSave={(value) => handleUpdateField('title', value)}
                    isEditable={canEdit}
                    displayClassName="text-2xl font-semibold"
                    inputClassName="text-2xl font-semibold h-auto py-1"
                    placeholder="Enter title..."
                  />
                  
                  {/* Location - Inline Edit */}
                  <div className="mt-2 flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <InlineEdit
                        value={workOrder.location || ''}
                        onSave={(value) => handleUpdateField('location', value)}
                        isEditable={canEdit}
                        displayClassName="text-sm"
                        inputClassName="text-sm h-8"
                        placeholder="Enter location..."
                        emptyText="No location specified"
                      />
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Calendar className="h-4 w-4" />
                      {formatDate(workOrder.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge className={`${statusInfo.bgColor} ${statusInfo.color}`}>
                    {statusInfo.label}
                  </Badge>
                  
                  {/* Priority - Inline Edit */}
                  {isEditingPriority ? (
                    <div className="flex items-center gap-2">
                      <Select
                        value={editedPriority}
                        onValueChange={setEditedPriority}
                        disabled={isSavingPriority}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSavePriority}
                        disabled={isSavingPriority}
                        className="h-8 w-8 p-0"
                      >
                        {isSavingPriority ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingPriority(false)}
                        disabled={isSavingPriority}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 group">
                      <Badge variant="outline" className={`${priorityInfo.bgColor} ${priorityInfo.color}`}>
                        {priorityInfo.label} Priority
                      </Badge>
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleStartEditPriority}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Description - Inline Edit */}
              <div className="prose max-w-none">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                <InlineEdit
                  value={workOrder.description || ''}
                  onSave={(value) => handleUpdateField('description', value)}
                  isEditable={canEdit}
                  type="textarea"
                  displayClassName="text-foreground"
                  inputClassName=""
                  placeholder="Enter description..."
                  emptyText="No description provided"
                />
              </div>
              
              {/* Action Buttons based on status and role */}
              <div className="mt-6 pt-6 border-t">
                {/* Staff Actions - Pending: Review and provide quote */}
                {isStaff && workOrder.status === 'pending' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-4">Review Work Order</h4>
                      
                      {/* Job Size Selection */}
                      <div className="space-y-3 mb-4">
                        <Label className="text-sm font-medium">Job Classification</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="jobSize"
                              value="small"
                              checked={jobSize === 'small'}
                              onChange={() => setJobSize('small')}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">Small Job (No Charge)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="jobSize"
                              value="large"
                              checked={jobSize === 'large'}
                              onChange={() => setJobSize('large')}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">Large Job (Requires Quote)</span>
                          </label>
                        </div>
                      </div>
                      
                      {/* Quote Fields for Large Jobs */}
                      {jobSize === 'large' && (
                        <div className="space-y-3 mb-4 p-3 bg-white rounded-md border">
                          <div>
                            <Label htmlFor="quoted-amount">Quoted Amount *</Label>
                            <div className="relative mt-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <Input
                                id="quoted-amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={quotedAmount}
                                onChange={(e) => setQuotedAmount(e.target.value)}
                                placeholder="0.00"
                                className="pl-7"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="quote-notes">Work Details & Explanation</Label>
                            <Textarea
                              id="quote-notes"
                              value={quoteNotes}
                              onChange={(e) => setQuoteNotes(e.target.value)}
                              placeholder="Explain what work is needed and why this charge applies..."
                              className="mt-1"
                              rows={3}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleProvideQuote} 
                          disabled={isProcessing}
                          className="flex-1"
                        >
                          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                          {jobSize === 'small' ? 'Approve & Start' : 'Send Quote to Tenant'}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Reject Option */}
                    <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Request
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Work Order</DialogTitle>
                          <DialogDescription>
                            Please provide a reason for rejecting this work order.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label htmlFor="rejection-reason">Reason for Rejection</Label>
                          <Textarea
                            id="rejection-reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason..."
                            className="mt-2"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Reject
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {/* Tenant Action - Quote Provided: Approve or Reject Quote */}
                {isOwner && workOrder.status === 'quote_provided' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-orange-800">Quote Requires Your Approval</h4>
                        
                        {/* Quote Details */}
                        <div className="mt-4 p-4 bg-white rounded-lg border border-orange-200">
                          <div className="text-center mb-4">
                            <p className="text-3xl font-bold text-orange-600">
                              {workOrder.quoted_amount 
                                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(workOrder.quoted_amount)
                                : 'Quote pending'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Quoted Amount</p>
                          </div>
                          
                          {workOrder.quote_notes && (
                            <div className="border-t pt-3 mt-3">
                              <p className="text-sm font-medium text-gray-700">Work Details:</p>
                              <p className="text-sm text-gray-600 mt-1">{workOrder.quote_notes}</p>
                            </div>
                          )}
                          
                          {workOrder.quote_provided_at && (
                            <p className="text-xs text-gray-400 mt-3">
                              Quote provided on {formatDate(workOrder.quote_provided_at)}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-3 mt-4">
                          <Button 
                            onClick={handleApproveQuote} 
                            disabled={isProcessing}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Approve Quote & Proceed
                          </Button>
                          <Dialog open={showQuoteRejectDialog} onOpenChange={setShowQuoteRejectDialog}>
                            <DialogTrigger asChild>
                              <Button variant="destructive" className="flex-1">
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject Quote
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Quote</DialogTitle>
                                <DialogDescription>
                                  Optionally provide a reason for rejecting this quote.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <Label htmlFor="quote-rejection-reason">Reason (Optional)</Label>
                                <Textarea
                                  id="quote-rejection-reason"
                                  value={quoteRejectionReason}
                                  onChange={(e) => setQuoteRejectionReason(e.target.value)}
                                  placeholder="Enter reason..."
                                  className="mt-2"
                                />
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setShowQuoteRejectDialog(false)}>
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleRejectQuote} disabled={isProcessing}>
                                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                  Reject Quote
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Staff View - Quote Provided */}
                {isStaff && workOrder.status === 'quote_provided' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-orange-700">
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">Quote Sent - Awaiting Tenant Approval</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Quoted Amount: <strong>{workOrder.quoted_amount 
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(workOrder.quoted_amount)
                        : 'N/A'}</strong></p>
                      {workOrder.quote_notes && <p className="mt-1">Notes: {workOrder.quote_notes}</p>}
                    </div>
                  </div>
                )}

                {/* Quote Rejected Status */}
                {workOrder.status === 'quote_rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">Quote Rejected by Tenant</span>
                    </div>
                    {workOrder.quote_rejection_reason && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Reason:</span> {workOrder.quote_rejection_reason}
                      </p>
                    )}
                  </div>
                )}

                {isStaff && workOrder.status === 'approved' && (
                  <Button onClick={handleStartWork} disabled={isProcessing}>
                    <Wrench className="h-4 w-4 mr-2" />
                    Start Work
                  </Button>
                )}

                {isStaff && workOrder.status === 'in_progress' && (
                  <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Complete Work Order</DialogTitle>
                        <DialogDescription>
                          Add completion notes and optionally upload a photo of the completed work.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <div>
                          <Label htmlFor="completion-notes">Completion Notes *</Label>
                          <Textarea
                            id="completion-notes"
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            placeholder="Describe the work completed..."
                            className="mt-2"
                            rows={4}
                          />
                        </div>
                        <div>
                          <Label>Completion Photo (Optional)</Label>
                          <div className="mt-2">
                            {completionPhotoPreview ? (
                              <div className="relative">
                                <img 
                                  src={completionPhotoPreview} 
                                  alt="Completion" 
                                  className="max-h-32 rounded-md"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="absolute top-0 right-0"
                                  onClick={() => {
                                    setCompletionPhoto(null);
                                    setCompletionPhotoPreview(null);
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => document.getElementById('completion-photo')?.click()}
                              >
                                <Camera className="h-4 w-4 mr-2" />
                                Upload Photo
                              </Button>
                            )}
                            <Input
                              id="completion-photo"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleCompletionPhotoChange}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleComplete} disabled={isProcessing}>
                          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Complete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Tenant Actions */}
                {isOwner && workOrder.status === 'completed' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-orange-800">Action Required</h4>
                        <p className="text-sm text-orange-700 mt-1">
                          The maintenance work has been completed. Please review and sign off.
                        </p>
                        <Dialog open={showSignOffDialog} onOpenChange={setShowSignOffDialog}>
                          <DialogTrigger asChild>
                            <Button className="mt-3">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Review & Sign Off
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Sign Off on Completed Work</DialogTitle>
                              <DialogDescription>
                                Please confirm that the work has been completed to your satisfaction.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                              {workOrder.completion_notes && (
                                <div className="bg-gray-50 p-3 rounded-md">
                                  <Label className="text-sm text-gray-500">Completion Notes from Staff</Label>
                                  <p className="mt-1 text-sm">{workOrder.completion_notes}</p>
                                </div>
                              )}
                              <div>
                                <Label>Rating (Optional)</Label>
                                <div className="flex gap-1 mt-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setRating(star)}
                                      className={`p-1 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                    >
                                      <Star className="h-6 w-6 fill-current" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="feedback">Feedback (Optional)</Label>
                                <Textarea
                                  id="feedback"
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  placeholder="Any additional feedback..."
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="signature">Your Name (as signature)</Label>
                                <Input
                                  id="signature"
                                  value={signature}
                                  onChange={(e) => setSignature(e.target.value)}
                                  placeholder="Type your name to sign"
                                  className="mt-2"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowSignOffDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleSignOff} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Sign Off
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                )}

                {/* Completed status info */}
                {workOrder.status === 'signed_off' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">This work order has been completed and signed off.</span>
                    </div>
                    {workOrder.tenant_rating && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-sm text-gray-600">Rating:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`h-4 w-4 ${workOrder.tenant_rating && workOrder.tenant_rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                    )}
                    {workOrder.tenant_feedback && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Feedback:</span> {workOrder.tenant_feedback}
                      </p>
                    )}
                  </div>
                )}

                {workOrder.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">This work order was rejected.</span>
                    </div>
                    {workOrder.rejection_reason && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Reason:</span> {workOrder.rejection_reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-sm text-gray-500">{formatDate(workOrder.created_at)}</p>
                  </div>
                </div>
                {workOrder.quote_provided_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Quote Provided</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(workOrder.quote_provided_at)}
                        {workOrder.quoted_amount && ` - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(workOrder.quoted_amount)}`}
                      </p>
                    </div>
                  </div>
                )}
                {workOrder.quote_approved_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Quote Approved by Tenant</p>
                      <p className="text-sm text-gray-500">{formatDate(workOrder.quote_approved_at)}</p>
                    </div>
                  </div>
                )}
                {workOrder.quote_rejected_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Quote Rejected by Tenant</p>
                      <p className="text-sm text-gray-500">{formatDate(workOrder.quote_rejected_at)}</p>
                    </div>
                  </div>
                )}
                {workOrder.approved_at && !workOrder.quote_approved_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Approved</p>
                      <p className="text-sm text-gray-500">{formatDate(workOrder.approved_at)}</p>
                    </div>
                  </div>
                )}
                {workOrder.rejected_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Rejected</p>
                      <p className="text-sm text-gray-500">{formatDate(workOrder.rejected_at)}</p>
                    </div>
                  </div>
                )}
                {workOrder.started_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Work Started</p>
                      <p className="text-sm text-gray-500">{formatDate(workOrder.started_at)}</p>
                    </div>
                  </div>
                )}
                {workOrder.completed_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Completed</p>
                      <p className="text-sm text-gray-500">{formatDate(workOrder.completed_at)}</p>
                    </div>
                  </div>
                )}
                {workOrder.signed_off_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <div>
                      <p className="font-medium">Signed Off</p>
                      <p className="text-sm text-gray-500">{formatDate(workOrder.signed_off_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Photos Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Photos & Documents
                </CardTitle>
                {canEdit && (
                  <div>
                    <Input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*,.heic,.heif,application/pdf"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Add Files
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {photos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No photos or documents attached</p>
                  {canEdit && (
                    <Button
                      variant="link"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="mt-2"
                    >
                      Click to upload
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo) => {
                    const isPdf = photo.photo_url.toLowerCase().endsWith('.pdf');
                    return (
                      <div key={photo.id} className="relative group">
                        {isPdf ? (
                          <a
                            href={photo.photo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-full h-40 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                          >
                            <div className="text-center">
                              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                              <span className="text-sm text-muted-foreground mt-2 block">PDF Document</span>
                            </div>
                          </a>
                        ) : (
                          <img 
                            src={photo.photo_url} 
                            alt={photo.caption || "Work order photo"}
                            className="w-full h-40 object-cover rounded-md"
                          />
                        )}
                        <Badge 
                          className="absolute bottom-2 left-2"
                          variant="secondary"
                        >
                          {photo.photo_type}
                        </Badge>
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePhoto(photo.id)}
                            disabled={isDeletingPhoto === photo.id}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                          >
                            {isDeletingPhoto === photo.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change History Card */}
          {history.length > 0 && (
            <Card>
              <Collapsible open={isHistoryExpanded} onOpenChange={setIsHistoryExpanded}>
                <CardHeader className="pb-3">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Change History
                        <Badge variant="secondary" className="ml-2">{history.length}</Badge>
                      </CardTitle>
                      {isHistoryExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {history.map((entry) => {
                        const changerName = entry.changed_by_profile?.full_name 
                          || entry.changed_by_profile?.email 
                          || 'Unknown user';
                        return (
                          <div 
                            key={entry.id} 
                            className="border-l-2 border-muted pl-4 py-2 hover:border-primary transition-colors"
                          >
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                              <User className="h-3 w-3" />
                              <span className="font-medium text-foreground">{changerName}</span>
                              <span className="text-muted-foreground">•</span>
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(entry.changed_at)}</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium text-foreground">
                                {formatFieldName(entry.field_name)}
                              </span>
                              <span className="text-muted-foreground"> changed</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm">
                              <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded line-through max-w-[200px] truncate">
                                {entry.old_value || '(empty)'}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded max-w-[200px] truncate">
                                {entry.new_value || '(empty)'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {/* Comments Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              ) : (
                <div className="space-y-4 mb-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              )}
              
              <Separator className="my-4" />
              
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default WorkOrderDetail;
