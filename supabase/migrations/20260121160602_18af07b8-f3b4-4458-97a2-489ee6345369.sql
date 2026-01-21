-- Create work_order_history table to track all changes
CREATE TABLE public.work_order_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_work_order_history_work_order_id ON public.work_order_history(work_order_id);
CREATE INDEX idx_work_order_history_changed_at ON public.work_order_history(changed_at DESC);

-- Enable Row Level Security
ALTER TABLE public.work_order_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Staff can view all history
CREATE POLICY "Staff can view all work order history"
ON public.work_order_history
FOR SELECT
USING (is_staff(auth.uid()));

-- RLS Policies: Tenants can view history for their own work orders
CREATE POLICY "Tenants can view history for their own work orders"
ON public.work_order_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.work_orders
    WHERE work_orders.id = work_order_history.work_order_id
    AND work_orders.tenant_id = auth.uid()
  )
);

-- RLS Policies: Staff can insert history records
CREATE POLICY "Staff can insert work order history"
ON public.work_order_history
FOR INSERT
WITH CHECK (is_staff(auth.uid()));

-- RLS Policies: Tenants can insert history for their own pending work orders
CREATE POLICY "Tenants can insert history for their own pending work orders"
ON public.work_order_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.work_orders
    WHERE work_orders.id = work_order_history.work_order_id
    AND work_orders.tenant_id = auth.uid()
    AND work_orders.status = 'pending'
  )
);