import { supabase } from "@/integrations/supabase/client";
import type { 
  WorkOrder, 
  WorkOrderInsert, 
  WorkOrderUpdate, 
  WorkOrderPhoto, 
  WorkOrderComment,
  WorkOrderHistory,
  WorkOrderStatus,
  WorkOrderPriority
} from "@/types/supabase-custom";

// ============================================
// Work Order CRUD Operations
// ============================================

/**
 * Create a new work order
 */
export async function createWorkOrder(
  workOrder: Omit<WorkOrderInsert, 'tenant_id'>,
  photoFiles?: File[]
): Promise<{ workOrder: WorkOrder | null; error: string | null }> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { workOrder: null, error: "You must be logged in to create a work order" };
    }

    // Create the work order
    const { data, error } = await (supabase as any)
      .from('work_orders')
      .insert({
        ...workOrder,
        tenant_id: user.id,
        status: 'pending' as WorkOrderStatus,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating work order:", error);
      return { workOrder: null, error: error.message };
    }

    // If photos were provided, upload them all
    if (photoFiles && photoFiles.length > 0 && data) {
      const uploadPromises = photoFiles.map((file) => 
        uploadWorkOrderPhoto(data.id, file, 'initial')
      );
      
      const results = await Promise.all(uploadPromises);
      const failedUploads = results.filter((r) => r.error);
      
      if (failedUploads.length > 0) {
        console.warn(`Work order created but ${failedUploads.length} photo upload(s) failed`);
      }
    }

    return { workOrder: data, error: null };
  } catch (err: any) {
    console.error("Error in createWorkOrder:", err);
    return { workOrder: null, error: err.message || "Failed to create work order" };
  }
}

/**
 * Fetch work orders for the current user (tenants see their own, staff sees all)
 */
export async function fetchWorkOrders(): Promise<WorkOrder[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('work_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching work orders:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error in fetchWorkOrders:", err);
    return [];
  }
}

/**
 * Fetch a single work order by ID
 */
export async function fetchWorkOrderById(id: string): Promise<WorkOrder | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('work_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching work order:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Error in fetchWorkOrderById:", err);
    return null;
  }
}

/**
 * Fetch work order with related data (photos, comments)
 */
export async function fetchWorkOrderWithDetails(id: string): Promise<{
  workOrder: WorkOrder | null;
  photos: WorkOrderPhoto[];
  comments: WorkOrderComment[];
}> {
  try {
    // Fetch work order
    const { data: workOrder, error: woError } = await (supabase as any)
      .from('work_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (woError) {
      console.error("Error fetching work order:", woError);
      return { workOrder: null, photos: [], comments: [] };
    }

    // Fetch photos
    const { data: photos, error: photosError } = await (supabase as any)
      .from('work_order_photos')
      .select('*')
      .eq('work_order_id', id)
      .order('created_at', { ascending: true });

    if (photosError) {
      console.error("Error fetching photos:", photosError);
    }

    // Fetch comments
    const { data: comments, error: commentsError } = await (supabase as any)
      .from('work_order_comments')
      .select('*')
      .eq('work_order_id', id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
    }

    return {
      workOrder,
      photos: photos || [],
      comments: comments || [],
    };
  } catch (err) {
    console.error("Error in fetchWorkOrderWithDetails:", err);
    return { workOrder: null, photos: [], comments: [] };
  }
}

// ============================================
// Work Order Field Updates
// ============================================

/**
 * Update work order field with history tracking
 */
export async function updateWorkOrderField(
  workOrderId: string,
  field: 'title' | 'location' | 'description' | 'priority',
  value: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get current value first
    const { data: currentWorkOrder, error: fetchError } = await (supabase as any)
      .from('work_orders')
      .select(field)
      .eq('id', workOrderId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const oldValue = currentWorkOrder?.[field] ?? null;
    
    // Skip if value hasn't changed
    if (oldValue === value) {
      return { success: true, error: null };
    }

    // Update the work order
    const { error: updateError } = await (supabase as any)
      .from('work_orders')
      .update({ [field]: value })
      .eq('id', workOrderId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log the change to history
    const { error: historyError } = await (supabase as any)
      .from('work_order_history')
      .insert({
        work_order_id: workOrderId,
        field_name: field,
        old_value: oldValue?.toString() ?? null,
        new_value: value,
        changed_by: user.id,
      });

    if (historyError) {
      console.warn("Failed to log history:", historyError);
      // Don't fail the operation if history logging fails
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Update multiple work order fields at once with history tracking
 */
export async function updateWorkOrder(
  workOrderId: string,
  updates: Partial<Pick<WorkOrder, 'title' | 'location' | 'description' | 'priority'>>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get current values first
    const fieldsToFetch = Object.keys(updates).join(', ');
    const { data: currentWorkOrder, error: fetchError } = await (supabase as any)
      .from('work_orders')
      .select(fieldsToFetch)
      .eq('id', workOrderId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    // Filter out unchanged values and prepare history records
    const changedFields: Record<string, string> = {};
    const historyRecords: Array<{
      work_order_id: string;
      field_name: string;
      old_value: string | null;
      new_value: string;
      changed_by: string;
    }> = [];

    for (const [field, newValue] of Object.entries(updates)) {
      const oldValue = currentWorkOrder?.[field];
      if (oldValue !== newValue && newValue !== undefined) {
        changedFields[field] = newValue as string;
        historyRecords.push({
          work_order_id: workOrderId,
          field_name: field,
          old_value: oldValue?.toString() ?? null,
          new_value: newValue as string,
          changed_by: user.id,
        });
      }
    }

    // If nothing changed, return early
    if (Object.keys(changedFields).length === 0) {
      return { success: true, error: null };
    }

    // Update the work order
    const { error: updateError } = await (supabase as any)
      .from('work_orders')
      .update(changedFields)
      .eq('id', workOrderId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log all changes to history
    if (historyRecords.length > 0) {
      const { error: historyError } = await (supabase as any)
        .from('work_order_history')
        .insert(historyRecords);

      if (historyError) {
        console.warn("Failed to log history:", historyError);
      }
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch change history for a work order
 */
export async function fetchWorkOrderHistory(workOrderId: string): Promise<WorkOrderHistory[]> {
  try {
    // Fetch history entries
    const { data: historyData, error } = await (supabase as any)
      .from('work_order_history')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error("Error fetching work order history:", error);
      return [];
    }

    if (!historyData || historyData.length === 0) {
      return [];
    }

    // Get unique user IDs from history
    const userIds = [...new Set(historyData.map((h: WorkOrderHistory) => h.changed_by))];

    // Fetch profiles for those users
    const { data: profilesData, error: profilesError } = await (supabase as any)
      .from('profiles')
      .select('user_id, full_name, email')
      .in('user_id', userIds);

    if (profilesError) {
      console.warn("Error fetching profiles for history:", profilesError);
    }

    // Create a map of user_id -> profile
    const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
    if (profilesData) {
      for (const profile of profilesData) {
        profileMap.set(profile.user_id, {
          full_name: profile.full_name,
          email: profile.email,
        });
      }
    }

    // Attach profile data to each history entry
    return historyData.map((entry: WorkOrderHistory) => ({
      ...entry,
      changed_by_profile: profileMap.get(entry.changed_by) || null,
    }));
  } catch (err) {
    console.error("Error in fetchWorkOrderHistory:", err);
    return [];
  }
}

/**
 * Update work order title (staff only) - legacy support
 */
export async function updateWorkOrderTitle(
  workOrderId: string,
  title: string
): Promise<{ success: boolean; error: string | null }> {
  return updateWorkOrderField(workOrderId, 'title', title);
}

/**
 * Soft delete a work order photo (for tenants)
 * Sets is_deleted = true instead of permanently removing
 */
export async function softDeleteWorkOrderPhoto(
  photoId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error: updateError } = await (supabase as any)
      .from('work_order_photos')
      .update({ is_deleted: true })
      .eq('id', photoId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Restore a soft-deleted work order photo (for staff only)
 */
export async function restoreWorkOrderPhoto(
  photoId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error: updateError } = await (supabase as any)
      .from('work_order_photos')
      .update({ is_deleted: false })
      .eq('id', photoId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Hard delete a work order photo (for admins only)
 * Permanently removes the photo from storage and database
 */
export async function deleteWorkOrderPhoto(
  photoId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get photo info first to get the storage path
    const { data: photo, error: fetchError } = await (supabase as any)
      .from('work_order_photos')
      .select('photo_url')
      .eq('id', photoId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    // Extract the file path from the URL
    if (photo?.photo_url) {
      const urlParts = photo.photo_url.split('/work-order-photos/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage
          .from('work-order-photos')
          .remove([filePath]);
      }
    }

    // Delete the database record
    const { error: deleteError } = await (supabase as any)
      .from('work_order_photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================
// Work Order Status Transitions
// ============================================

/**
 * Provide a quote for a work order (maintenance/admin only)
 * For small jobs: directly approves the work order
 * For large jobs: sets status to quote_provided
 */
export async function provideQuote(
  workOrderId: string,
  data: {
    jobSize: 'small' | 'large';
    quotedAmount?: number;
    quoteNotes?: string;
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const now = new Date().toISOString();

    if (data.jobSize === 'small') {
      // Small jobs go directly to approved
      const { error } = await (supabase as any)
        .from('work_orders')
        .update({
          status: 'approved' as WorkOrderStatus,
          job_size: 'small',
          approved_by: user.id,
          approved_at: now,
        })
        .eq('id', workOrderId);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Large jobs require tenant approval
      if (!data.quotedAmount || data.quotedAmount <= 0) {
        return { success: false, error: "Quoted amount is required for large jobs" };
      }

      const { error } = await (supabase as any)
        .from('work_orders')
        .update({
          status: 'quote_provided' as WorkOrderStatus,
          job_size: 'large',
          quoted_amount: data.quotedAmount,
          quote_notes: data.quoteNotes || null,
          quote_provided_at: now,
          quote_provided_by: user.id,
        })
        .eq('id', workOrderId);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Tenant approves a quote
 */
export async function approveQuote(
  workOrderId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const now = new Date().toISOString();

    const { error } = await (supabase as any)
      .from('work_orders')
      .update({
        status: 'approved' as WorkOrderStatus,
        quote_approved_at: now,
        approved_at: now,
      })
      .eq('id', workOrderId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Tenant rejects a quote
 */
export async function rejectQuote(
  workOrderId: string,
  reason?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const now = new Date().toISOString();

    const { error } = await (supabase as any)
      .from('work_orders')
      .update({
        status: 'quote_rejected' as WorkOrderStatus,
        quote_rejected_at: now,
        quote_rejection_reason: reason || null,
      })
      .eq('id', workOrderId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Approve a work order (maintenance/admin only) - Legacy support
 */
export async function approveWorkOrder(
  workOrderId: string, 
  assignedTo?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const updateData: WorkOrderUpdate = {
      status: 'approved' as WorkOrderStatus,
      approved_by: user?.id,
    };
    
    if (assignedTo) {
      updateData.assigned_to = assignedTo;
    }

    const { error } = await (supabase as any)
      .from('work_orders')
      .update(updateData)
      .eq('id', workOrderId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Reject a work order (maintenance/admin only)
 */
export async function rejectWorkOrder(
  workOrderId: string, 
  reason: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await (supabase as any)
      .from('work_orders')
      .update({
        status: 'rejected' as WorkOrderStatus,
        rejected_by: user?.id,
        rejection_reason: reason,
      })
      .eq('id', workOrderId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Start work on a work order (maintenance only)
 */
export async function startWorkOrder(
  workOrderId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await (supabase as any)
      .from('work_orders')
      .update({
        status: 'in_progress' as WorkOrderStatus,
      })
      .eq('id', workOrderId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Complete a work order (maintenance only)
 */
export async function completeWorkOrder(
  workOrderId: string,
  completionNotes: string,
  completionPhoto?: File
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Upload completion photo if provided
    if (completionPhoto) {
      const photoResult = await uploadWorkOrderPhoto(workOrderId, completionPhoto, 'completion');
      if (photoResult.error) {
        console.warn("Completion photo upload failed:", photoResult.error);
      }
    }

    const { error } = await (supabase as any)
      .from('work_orders')
      .update({
        status: 'completed' as WorkOrderStatus,
        completion_notes: completionNotes,
      })
      .eq('id', workOrderId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Tenant signs off on completed work
 */
export async function signOffWorkOrder(
  workOrderId: string,
  feedback?: string,
  rating?: number,
  signature?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await (supabase as any)
      .from('work_orders')
      .update({
        status: 'signed_off' as WorkOrderStatus,
        tenant_feedback: feedback,
        tenant_rating: rating,
        tenant_signature: signature,
      })
      .eq('id', workOrderId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================
// Photo Operations
// ============================================

/**
 * Upload a photo for a work order
 */
export async function uploadWorkOrderPhoto(
  workOrderId: string,
  file: File,
  photoType: 'initial' | 'in_progress' | 'completion',
  caption?: string
): Promise<{ photo: WorkOrderPhoto | null; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { photo: null, error: "Not authenticated" };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${workOrderId}/${photoType}_${Date.now()}.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('work-order-photos')
      .upload(fileName, file);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { photo: null, error: uploadError.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('work-order-photos')
      .getPublicUrl(fileName);

    // Create photo record in database
    const { data: photo, error: dbError } = await (supabase as any)
      .from('work_order_photos')
      .insert({
        work_order_id: workOrderId,
        uploaded_by: user.id,
        photo_url: publicUrl,
        photo_type: photoType,
        caption: caption,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      return { photo: null, error: dbError.message };
    }

    return { photo, error: null };
  } catch (err: any) {
    console.error("Error in uploadWorkOrderPhoto:", err);
    return { photo: null, error: err.message };
  }
}

/**
 * Fetch photos for a work order
 */
export async function fetchWorkOrderPhotos(workOrderId: string): Promise<WorkOrderPhoto[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('work_order_photos')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching photos:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error in fetchWorkOrderPhotos:", err);
    return [];
  }
}

// ============================================
// Comment Operations
// ============================================

/**
 * Add a comment to a work order
 */
export async function addWorkOrderComment(
  workOrderId: string,
  comment: string,
  isInternal: boolean = false
): Promise<{ comment: WorkOrderComment | null; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { comment: null, error: "Not authenticated" };
    }

    const { data, error } = await (supabase as any)
      .from('work_order_comments')
      .insert({
        work_order_id: workOrderId,
        user_id: user.id,
        comment: comment,
        is_internal: isInternal,
      })
      .select()
      .single();

    if (error) {
      return { comment: null, error: error.message };
    }

    return { comment: data, error: null };
  } catch (err: any) {
    return { comment: null, error: err.message };
  }
}

/**
 * Fetch comments for a work order
 */
export async function fetchWorkOrderComments(workOrderId: string): Promise<WorkOrderComment[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('work_order_comments')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error in fetchWorkOrderComments:", err);
    return [];
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get status display info
 */
export function getStatusInfo(status: WorkOrderStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  const statusMap: Record<WorkOrderStatus, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pending Review', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    quote_provided: { label: 'Quote Provided', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    quote_rejected: { label: 'Quote Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
    approved: { label: 'Approved', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    in_progress: { label: 'In Progress', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    completed: { label: 'Completed - Awaiting Sign-off', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    signed_off: { label: 'Signed Off', color: 'text-green-700', bgColor: 'bg-green-100' },
    rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
  };

  return statusMap[status] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
}

/**
 * Get priority display info
 */
export function getPriorityInfo(priority: WorkOrderPriority): {
  label: string;
  color: string;
  bgColor: string;
} {
  const priorityMap: Record<WorkOrderPriority, { label: string; color: string; bgColor: string }> = {
    low: { label: 'Low', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    medium: { label: 'Medium', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    high: { label: 'High', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    emergency: { label: 'Emergency', color: 'text-red-700', bgColor: 'bg-red-100' },
  };

  return priorityMap[priority] || { label: priority, color: 'text-gray-700', bgColor: 'bg-gray-100' };
}

// Re-export types for convenience
export type { WorkOrder, WorkOrderPhoto, WorkOrderComment, WorkOrderHistory, WorkOrderStatus, WorkOrderPriority };
