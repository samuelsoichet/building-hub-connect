import { supabase } from "@/integrations/supabase/client";

// Define types locally since they may not be in generated types yet
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'emergency';
export type WorkOrderStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'signed_off' | 'rejected';

export interface WorkOrder {
  id: string;
  user_id: string;
  title: string;
  description: string;
  location: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  photo_url?: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateWorkOrderInput {
  title: string;
  description: string;
  location: string;
  priority: WorkOrderPriority;
}

export async function createWorkOrder(
  input: CreateWorkOrderInput,
  photoFile?: File
): Promise<{ data?: WorkOrder; error?: string }> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return { error: "You must be logged in to submit a work order" };
    }

    let photoUrl: string | null = null;

    // Upload photo if provided
    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${userData.user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('work-order-photos')
        .upload(fileName, photoFile);

      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        // Continue without photo if upload fails
      } else {
        const { data: urlData } = supabase.storage
          .from('work-order-photos')
          .getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }
    }

    const { data, error } = await (supabase as any)
      .from('work_orders')
      .insert({
        user_id: userData.user.id,
        title: input.title,
        description: input.description,
        location: input.location,
        priority: input.priority,
        photo_url: photoUrl,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating work order:', error);
      return { error: error.message };
    }

    return { data: data as WorkOrder };
  } catch (error: any) {
    console.error('Error creating work order:', error);
    return { error: error.message || 'Failed to create work order' };
  }
}

export async function fetchWorkOrders(): Promise<WorkOrder[]> {
  const { data, error } = await (supabase as any)
    .from('work_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching work orders:', error);
    throw error;
  }

  return (data || []) as WorkOrder[];
}

export function getStatusInfo(status: WorkOrderStatus) {
  const statusMap = {
    pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    approved: { label: 'Approved', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    in_progress: { label: 'In Progress', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    completed: { label: 'Completed', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    signed_off: { label: 'Signed Off', color: 'text-green-700', bgColor: 'bg-green-100' },
    rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
  };
  return statusMap[status] || statusMap.pending;
}

export function getPriorityInfo(priority: WorkOrderPriority) {
  const priorityMap = {
    low: { label: 'Low', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    medium: { label: 'Medium', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    high: { label: 'High', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    emergency: { label: 'Emergency', color: 'text-red-700', bgColor: 'bg-red-100' },
  };
  return priorityMap[priority] || priorityMap.low;
}
