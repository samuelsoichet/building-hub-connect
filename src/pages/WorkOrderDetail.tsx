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
  Upload,
  User,
  Calendar,
  MapPin,
  AlertTriangle,
  Pencil,
  Check,
  X
} from "lucide-react";
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
  updateWorkOrderTitle,
  getStatusInfo, 
  getPriorityInfo 
} from "@/services/work-order-service";
import type { WorkOrder, WorkOrderPhoto, WorkOrderComment } from "@/types/supabase-custom";

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
  
  // Title editing states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      loadWorkOrder();
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
  const isTenant = role === 'tenant';
  const isOwner = workOrder?.tenant_id === user?.id;

  const handleStartEditTitle = () => {
    if (workOrder) {
      setEditedTitle(workOrder.title);
      setIsEditingTitle(true);
      setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  };

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle("");
  };

  const handleSaveTitle = async () => {
    if (!id || !editedTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    
    if (editedTitle.trim() === workOrder?.title) {
      setIsEditingTitle(false);
      return;
    }

    setIsSavingTitle(true);
    try {
      const result = await updateWorkOrderTitle(id, editedTitle.trim());
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Title updated");
      setIsEditingTitle(false);
      loadWorkOrder();
    } catch (error) {
      toast.error("Failed to update title");
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEditTitle();
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
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2">
                      <Input
                        ref={titleInputRef}
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onKeyDown={handleTitleKeyDown}
                        className="text-2xl font-semibold h-auto py-1"
                        disabled={isSavingTitle}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSaveTitle}
                        disabled={isSavingTitle}
                      >
                        {isSavingTitle ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEditTitle}
                        disabled={isSavingTitle}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <CardTitle className="text-2xl">{workOrder.title}</CardTitle>
                      {isStaff && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleStartEditTitle}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  <CardDescription className="mt-2 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {workOrder.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(workOrder.created_at)}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge className={`${statusInfo.bgColor} ${statusInfo.color}`}>
                    {statusInfo.label}
                  </Badge>
                  <Badge variant="outline" className={`${priorityInfo.bgColor} ${priorityInfo.color}`}>
                    {priorityInfo.label} Priority
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                <p className="text-gray-700">{workOrder.description}</p>
              </div>
              
              {/* Action Buttons based on status and role */}
              <div className="mt-6 pt-6 border-t">
                {/* Staff Actions */}
                {isStaff && workOrder.status === 'pending' && (
                  <div className="flex gap-3">
                    <Button onClick={handleApprove} disabled={isProcessing}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                      <DialogTrigger asChild>
                        <Button variant="destructive">
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
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
                {workOrder.approved_at && (
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
          {photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative">
                      <img 
                        src={photo.photo_url} 
                        alt={photo.caption || "Work order photo"}
                        className="w-full h-40 object-cover rounded-md"
                      />
                      <Badge 
                        className="absolute bottom-2 left-2"
                        variant="secondary"
                      >
                        {photo.photo_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
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
