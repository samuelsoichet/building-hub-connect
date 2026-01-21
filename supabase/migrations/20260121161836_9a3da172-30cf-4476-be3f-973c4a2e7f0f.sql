-- Add new status values to the work_order_status enum
ALTER TYPE work_order_status ADD VALUE IF NOT EXISTS 'quote_provided';
ALTER TYPE work_order_status ADD VALUE IF NOT EXISTS 'quote_rejected';

-- Add new columns for quote workflow
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS job_size TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quoted_amount DECIMAL(10,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quote_notes TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quote_provided_at TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quote_provided_by UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quote_approved_at TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quote_rejected_at TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quote_rejection_reason TEXT;

-- Add check constraint for job_size
ALTER TABLE work_orders ADD CONSTRAINT work_orders_job_size_check 
  CHECK (job_size IS NULL OR job_size IN ('small', 'large'));

-- Add signoff_rating and signoff_feedback if they don't exist (referenced in email function)
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS signoff_rating INTEGER;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS signoff_feedback TEXT;