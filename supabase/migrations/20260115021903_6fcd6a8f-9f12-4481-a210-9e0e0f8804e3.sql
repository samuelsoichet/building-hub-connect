-- Add RLS policy for admins to read all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Add RLS policy for admins to read all user_roles
DROP POLICY IF EXISTS "Admins can view all user_roles" ON public.user_roles;
CREATE POLICY "Admins can view all user_roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Add RLS policy for admins to update user_roles
DROP POLICY IF EXISTS "Admins can update user_roles" ON public.user_roles;
CREATE POLICY "Admins can update user_roles"
ON public.user_roles
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Add RLS policy for admins to insert user_roles
DROP POLICY IF EXISTS "Admins can insert user_roles" ON public.user_roles;
CREATE POLICY "Admins can insert user_roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Add RLS policy for admins to view all units
DROP POLICY IF EXISTS "Admins can view all units" ON public.units;
CREATE POLICY "Admins can view all units"
ON public.units
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Add RLS policy for admins to update units (for assigning tenants)
DROP POLICY IF EXISTS "Admins can update units" ON public.units;
CREATE POLICY "Admins can update units"
ON public.units
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));