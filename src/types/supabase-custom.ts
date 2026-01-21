// Custom types since the auto-generated types.ts is read-only
// These types match the database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type UserRole = 'admin' | 'tenant' | 'maintenance';
export type WorkOrderStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'signed_off' | 'rejected';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'emergency';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
export type NotificationType = 
  | 'work_order_created'
  | 'work_order_approved'
  | 'work_order_rejected'
  | 'work_order_in_progress'
  | 'work_order_completed'
  | 'work_order_signed_off'
  | 'payment_received'
  | 'payment_due'
  | 'general';

// Table Row Types
export interface WorkOrder {
  id: string;
  tenant_id: string;
  unit_id: string | null;
  title: string;
  description: string;
  location: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assigned_to: string | null;
  approved_at: string | null;
  approved_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  signed_off_at: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  tenant_signature: string | null;
  tenant_feedback: string | null;
  tenant_rating: number | null;
  completion_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderInsert {
  id?: string;
  tenant_id?: string;
  unit_id?: string | null;
  title: string;
  description: string;
  location: string;
  priority?: WorkOrderPriority;
  status?: WorkOrderStatus;
  assigned_to?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  signed_off_at?: string | null;
  rejected_at?: string | null;
  rejected_by?: string | null;
  rejection_reason?: string | null;
  tenant_signature?: string | null;
  tenant_feedback?: string | null;
  tenant_rating?: number | null;
  completion_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WorkOrderUpdate {
  id?: string;
  tenant_id?: string;
  unit_id?: string | null;
  title?: string;
  description?: string;
  location?: string;
  priority?: WorkOrderPriority;
  status?: WorkOrderStatus;
  assigned_to?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  signed_off_at?: string | null;
  rejected_at?: string | null;
  rejected_by?: string | null;
  rejection_reason?: string | null;
  tenant_signature?: string | null;
  tenant_feedback?: string | null;
  tenant_rating?: number | null;
  completion_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WorkOrderPhoto {
  id: string;
  work_order_id: string;
  uploaded_by: string;
  photo_url: string;
  photo_type: 'initial' | 'in_progress' | 'completion';
  caption: string | null;
  created_at: string;
}

export interface WorkOrderPhotoInsert {
  id?: string;
  work_order_id: string;
  uploaded_by: string;
  photo_url: string;
  photo_type: 'initial' | 'in_progress' | 'completion';
  caption?: string | null;
  created_at?: string;
}

export interface WorkOrderComment {
  id: string;
  work_order_id: string;
  user_id: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

export interface WorkOrderCommentInsert {
  id?: string;
  work_order_id: string;
  user_id: string;
  comment: string;
  is_internal?: boolean;
  created_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_id: string | null;
  related_type: string | null;
  read: boolean;
  read_at: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  suite_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantBalance {
  id: string;
  tenant_id: string;
  current_balance: number;
  rent_amount: number;
  next_payment_due: string | null;
  last_payment_date: string | null;
  suite_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  status: PaymentStatus;
  description: string | null;
  payment_method: string | null;
  stripe_customer_id: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  receipt_url: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderHistory {
  id: string;
  work_order_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_at: string;
}

export interface WorkOrderHistoryInsert {
  id?: string;
  work_order_id: string;
  field_name: string;
  old_value?: string | null;
  new_value?: string | null;
  changed_by: string;
  changed_at?: string;
}
