-- =============================================
-- TENANT PORTAL COMPLETE SCHEMA MIGRATION
-- =============================================

-- 1. CREATE ENUMS
-- =============================================

CREATE TYPE public.user_role AS ENUM ('admin', 'tenant', 'maintenance');

CREATE TYPE public.work_order_status AS ENUM ('pending', 'approved', 'in_progress', 'completed', 'signed_off', 'rejected');

CREATE TYPE public.work_order_priority AS ENUM ('low', 'medium', 'high', 'emergency');

CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'cancelled');

CREATE TYPE public.notification_type AS ENUM (
  'work_order_created', 
  'work_order_approved', 
  'work_order_rejected', 
  'work_order_in_progress', 
  'work_order_completed', 
  'work_order_signed_off', 
  'payment_received', 
  'payment_due', 
  'general'
);

-- 2. CREATE TABLES
-- =============================================

-- USER_ROLES table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role public.user_role NOT NULL DEFAULT 'tenant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- PROFILES table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  suite_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- PROPERTIES table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- UNITS table
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  floor INTEGER,
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  square_feet INTEGER,
  rent_amount NUMERIC(10,2),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- WORK_ORDERS table
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  priority public.work_order_priority NOT NULL DEFAULT 'medium',
  status public.work_order_status NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  signed_off_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  tenant_signature TEXT,
  tenant_feedback TEXT,
  tenant_rating INTEGER CHECK (tenant_rating >= 1 AND tenant_rating <= 5),
  completion_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- WORK_ORDER_PHOTOS table
CREATE TABLE public.work_order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('initial', 'in_progress', 'completion')) DEFAULT 'initial',
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.work_order_photos ENABLE ROW LEVEL SECURITY;

-- WORK_ORDER_COMMENTS table
CREATE TABLE public.work_order_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.work_order_comments ENABLE ROW LEVEL SECURITY;

-- TENANT_BALANCES table
CREATE TABLE public.tenant_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  rent_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  next_payment_due DATE,
  last_payment_date DATE,
  suite_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_balances ENABLE ROW LEVEL SECURITY;

-- PAYMENTS table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  description TEXT,
  payment_method TEXT,
  stripe_customer_id TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  receipt_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- NOTIFICATIONS table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT,
  related_id UUID,
  related_type TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. CREATE HELPER FUNCTIONS (Security Definer to avoid RLS recursion)
-- =============================================

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_maintenance(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'maintenance'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role IN ('admin', 'maintenance')
  );
$$;

-- 4. CREATE RLS POLICIES
-- =============================================

-- USER_ROLES policies
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin(auth.uid()));

-- PROFILES policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin(auth.uid()));

-- PROPERTIES policies
CREATE POLICY "Anyone can view properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage properties"
  ON public.properties FOR ALL
  USING (public.is_admin(auth.uid()));

-- UNITS policies
CREATE POLICY "Tenants can view their assigned unit"
  ON public.units FOR SELECT
  USING (auth.uid() = tenant_id OR public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage all units"
  ON public.units FOR ALL
  USING (public.is_admin(auth.uid()));

-- WORK_ORDERS policies
CREATE POLICY "Tenants can view their own work orders"
  ON public.work_orders FOR SELECT
  USING (auth.uid() = tenant_id OR public.is_staff(auth.uid()));

CREATE POLICY "Tenants can create work orders"
  ON public.work_orders FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can update their own work orders"
  ON public.work_orders FOR UPDATE
  USING (auth.uid() = tenant_id OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage all work orders"
  ON public.work_orders FOR ALL
  USING (public.is_staff(auth.uid()));

-- WORK_ORDER_PHOTOS policies
CREATE POLICY "Users can view photos for their work orders"
  ON public.work_order_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.work_orders 
      WHERE id = work_order_id 
      AND (tenant_id = auth.uid() OR public.is_staff(auth.uid()))
    )
  );

CREATE POLICY "Users can upload photos to their work orders"
  ON public.work_order_photos FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.work_orders 
      WHERE id = work_order_id 
      AND (tenant_id = auth.uid() OR public.is_staff(auth.uid()))
    )
  );

CREATE POLICY "Staff can manage all photos"
  ON public.work_order_photos FOR ALL
  USING (public.is_staff(auth.uid()));

-- WORK_ORDER_COMMENTS policies
CREATE POLICY "Users can view non-internal comments on their work orders"
  ON public.work_order_comments FOR SELECT
  USING (
    (NOT is_internal AND EXISTS (
      SELECT 1 FROM public.work_orders 
      WHERE id = work_order_id AND tenant_id = auth.uid()
    ))
    OR public.is_staff(auth.uid())
  );

CREATE POLICY "Users can create comments on their work orders"
  ON public.work_order_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.work_orders 
      WHERE id = work_order_id 
      AND (tenant_id = auth.uid() OR public.is_staff(auth.uid()))
    )
  );

CREATE POLICY "Staff can manage all comments"
  ON public.work_order_comments FOR ALL
  USING (public.is_staff(auth.uid()));

-- TENANT_BALANCES policies
CREATE POLICY "Tenants can view their own balance"
  ON public.tenant_balances FOR SELECT
  USING (auth.uid() = tenant_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all balances"
  ON public.tenant_balances FOR ALL
  USING (public.is_admin(auth.uid()));

-- PAYMENTS policies
CREATE POLICY "Tenants can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = tenant_id OR public.is_admin(auth.uid()));

CREATE POLICY "Tenants can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Admins can manage all payments"
  ON public.payments FOR ALL
  USING (public.is_admin(auth.uid()));

-- NOTIFICATIONS policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  USING (public.is_admin(auth.uid()));

-- 5. CREATE TRIGGERS
-- =============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at_user_roles
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_properties
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_units
  BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_work_orders
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_tenant_balances
  BEFORE UPDATE ON public.tenant_balances
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_payments
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- New user trigger: create user_roles, profiles, tenant_balances
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create user role (default: tenant)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'tenant');
  
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  
  -- Create tenant balance entry
  INSERT INTO public.tenant_balances (tenant_id, current_balance, rent_amount)
  VALUES (NEW.id, 0, 0);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Work order status change notification trigger
CREATE OR REPLACE FUNCTION public.handle_work_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_type_val public.notification_type;
BEGIN
  -- Only trigger on status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'approved' THEN
        notification_type_val := 'work_order_approved';
        notification_title := 'Work Order Approved';
        notification_message := 'Your work order "' || NEW.title || '" has been approved.';
      WHEN 'rejected' THEN
        notification_type_val := 'work_order_rejected';
        notification_title := 'Work Order Rejected';
        notification_message := 'Your work order "' || NEW.title || '" has been rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided');
      WHEN 'in_progress' THEN
        notification_type_val := 'work_order_in_progress';
        notification_title := 'Work Order In Progress';
        notification_message := 'Work has started on your request "' || NEW.title || '".';
      WHEN 'completed' THEN
        notification_type_val := 'work_order_completed';
        notification_title := 'Work Order Completed';
        notification_message := 'Your work order "' || NEW.title || '" has been completed. Please sign off when verified.';
      WHEN 'signed_off' THEN
        notification_type_val := 'work_order_signed_off';
        notification_title := 'Work Order Signed Off';
        notification_message := 'Work order "' || NEW.title || '" has been signed off and closed.';
      ELSE
        RETURN NEW;
    END CASE;
    
    -- Create notification for tenant
    INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
    VALUES (NEW.tenant_id, notification_type_val, notification_title, notification_message, NEW.id, 'work_order');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_work_order_status_change
  AFTER UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_work_order_status_change();

-- 6. CREATE STORAGE BUCKET
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('work-order-photos', 'work-order-photos', true);

-- Storage policies for work-order-photos bucket
CREATE POLICY "Anyone can view work order photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'work-order-photos');

CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'work-order-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'work-order-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'work-order-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 7. ADMIN HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.make_user_admin(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  UPDATE public.user_roles SET role = 'admin', updated_at = now()
  WHERE user_id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.make_user_maintenance(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  UPDATE public.user_roles SET role = 'maintenance', updated_at = now()
  WHERE user_id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_tenant_to_unit(user_email TEXT, unit_num TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  target_unit_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  SELECT id INTO target_unit_id FROM public.units WHERE unit_number = unit_num;
  IF target_unit_id IS NULL THEN
    RAISE EXCEPTION 'Unit with number % not found', unit_num;
  END IF;
  
  -- Update unit with tenant
  UPDATE public.units SET tenant_id = target_user_id, updated_at = now()
  WHERE id = target_unit_id;
  
  -- Update profile with suite number
  UPDATE public.profiles SET suite_number = unit_num, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Update tenant balance with suite number
  UPDATE public.tenant_balances SET suite_number = unit_num, updated_at = now()
  WHERE tenant_id = target_user_id;
END;
$$;