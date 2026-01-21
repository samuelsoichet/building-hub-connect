-- Drop the existing restrictive update policy
DROP POLICY IF EXISTS "Users can soft delete their own photos" ON public.work_order_photos;

-- Recreate with both USING and WITH CHECK clauses
CREATE POLICY "Users can soft delete their own photos" 
ON public.work_order_photos 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM work_orders
    WHERE work_orders.id = work_order_photos.work_order_id
    AND (
      is_staff(auth.uid()) 
      OR (work_orders.tenant_id = auth.uid() AND work_order_photos.uploaded_by = auth.uid())
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM work_orders
    WHERE work_orders.id = work_order_photos.work_order_id
    AND (
      is_staff(auth.uid()) 
      OR (work_orders.tenant_id = auth.uid() AND work_order_photos.uploaded_by = auth.uid())
    )
  )
);