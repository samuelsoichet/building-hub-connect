-- Create a function that sends work order emails via edge function
-- This uses pg_net extension to make HTTP calls to our edge function
CREATE OR REPLACE FUNCTION public.send_work_order_email_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  tenant_email TEXT;
  tenant_name TEXT;
  payload JSONB;
  edge_function_url TEXT;
BEGIN
  -- Get tenant information
  SELECT p.email, p.full_name 
  INTO tenant_email, tenant_name
  FROM public.profiles p
  WHERE p.user_id = COALESCE(NEW.tenant_id, OLD.tenant_id);

  edge_function_url := 'https://npgiplvhokbrdevzsojx.supabase.co/functions/v1/send-work-order-email';

  -- Determine which type of notification to send
  IF TG_OP = 'INSERT' THEN
    -- New work order created
    payload := jsonb_build_object(
      'type', 'new',
      'work_order_id', NEW.id::text,
      'title', NEW.title,
      'description', COALESCE(NEW.description, ''),
      'location', COALESCE(NEW.location, ''),
      'priority', NEW.priority::text,
      'tenant_email', tenant_email,
      'tenant_name', tenant_name
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Status changed
    IF NEW.status = 'approved' THEN
      payload := jsonb_build_object(
        'type', 'approved',
        'work_order_id', NEW.id::text,
        'title', NEW.title,
        'description', COALESCE(NEW.description, ''),
        'location', COALESCE(NEW.location, ''),
        'priority', NEW.priority::text,
        'tenant_email', tenant_email,
        'tenant_name', tenant_name,
        'assigned_to', NEW.assigned_to
      );
    ELSIF NEW.status = 'completed' THEN
      payload := jsonb_build_object(
        'type', 'completed',
        'work_order_id', NEW.id::text,
        'title', NEW.title,
        'description', COALESCE(NEW.description, ''),
        'location', COALESCE(NEW.location, ''),
        'priority', NEW.priority::text,
        'tenant_email', tenant_email,
        'tenant_name', tenant_name,
        'completion_notes', NEW.completion_notes
      );
    ELSIF NEW.status = 'signed_off' THEN
      payload := jsonb_build_object(
        'type', 'signed_off',
        'work_order_id', NEW.id::text,
        'title', NEW.title,
        'description', COALESCE(NEW.description, ''),
        'location', COALESCE(NEW.location, ''),
        'priority', NEW.priority::text,
        'tenant_email', tenant_email,
        'tenant_name', tenant_name,
        'rating', NEW.signoff_rating,
        'feedback', NEW.signoff_feedback
      );
    ELSE
      -- No email for other status changes
      RETURN NEW;
    END IF;
  ELSE
    -- No notification needed
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Call the edge function using pg_net
  -- Note: This requires the pg_net extension to be enabled
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the transaction
  RAISE WARNING 'Failed to send work order email notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create trigger for new work orders
DROP TRIGGER IF EXISTS trigger_work_order_email_new ON public.work_orders;
CREATE TRIGGER trigger_work_order_email_new
  AFTER INSERT ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.send_work_order_email_notification();

-- Create trigger for work order status updates
DROP TRIGGER IF EXISTS trigger_work_order_email_update ON public.work_orders;
CREATE TRIGGER trigger_work_order_email_update
  AFTER UPDATE ON public.work_orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.send_work_order_email_notification();