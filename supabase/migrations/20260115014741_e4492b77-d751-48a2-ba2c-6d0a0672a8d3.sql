-- Fix security warnings

-- 1. Fix handle_updated_at function - add search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Fix notifications INSERT policy - require authenticated user and proper user_id
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Authenticated users can create notifications for themselves or staff can create for anyone"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR public.is_staff(auth.uid())
  );