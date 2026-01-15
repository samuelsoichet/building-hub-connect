-- Drop all existing policies on properties table to start fresh
DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage properties" ON public.properties;
DROP POLICY IF EXISTS "Staff can view properties" ON public.properties;
DROP POLICY IF EXISTS "Tenants can view their assigned property" ON public.properties;

-- Create secure policy: Only staff (admin/maintenance) can view all properties
CREATE POLICY "Staff can view all properties" 
ON public.properties 
FOR SELECT 
USING (public.is_staff(auth.uid()));

-- Create policy for tenants to view their assigned property via units
CREATE POLICY "Tenants can view their property"
ON public.properties
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.units u
    WHERE u.property_id = properties.id
    AND u.tenant_id = auth.uid()
  )
);

-- Only admins can insert properties
CREATE POLICY "Admins can insert properties"
ON public.properties
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can update properties
CREATE POLICY "Admins can update properties"
ON public.properties
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can delete properties
CREATE POLICY "Admins can delete properties"
ON public.properties
FOR DELETE
USING (public.is_admin(auth.uid()));