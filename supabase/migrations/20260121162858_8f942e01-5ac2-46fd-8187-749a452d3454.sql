-- Add is_deleted column to work_order_photos
ALTER TABLE public.work_order_photos 
ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view photos for their work orders" ON public.work_order_photos;

-- Create new SELECT policy: tenants see non-deleted photos, staff sees all
CREATE POLICY "Users can view photos for their work orders" 
ON public.work_order_photos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM work_orders
    WHERE work_orders.id = work_order_photos.work_order_id 
    AND (
      -- Staff can see all photos (including deleted)
      is_staff(auth.uid()) 
      OR 
      -- Tenants can only see non-deleted photos for their work orders
      (work_orders.tenant_id = auth.uid() AND work_order_photos.is_deleted = false)
    )
  )
);

-- Add UPDATE policy for soft delete by tenants and undelete by staff
CREATE POLICY "Users can soft delete their own photos" 
ON public.work_order_photos 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM work_orders
    WHERE work_orders.id = work_order_photos.work_order_id 
    AND (
      -- Staff can update any photo (for undelete)
      is_staff(auth.uid()) 
      OR 
      -- Tenants can only update their own photos
      (work_orders.tenant_id = auth.uid() AND work_order_photos.uploaded_by = auth.uid())
    )
  )
);

-- Add DELETE policy for admins only (hard delete)
CREATE POLICY "Admins can permanently delete photos" 
ON public.work_order_photos 
FOR DELETE 
USING (is_admin(auth.uid()));