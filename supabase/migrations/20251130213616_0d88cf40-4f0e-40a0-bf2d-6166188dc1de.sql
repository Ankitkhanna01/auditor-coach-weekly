-- Add is_paid and snoozed_until columns to bills table
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS snoozed_until timestamp with time zone DEFAULT NULL;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_bills_is_paid ON public.bills(is_paid);
CREATE INDEX IF NOT EXISTS idx_bills_snoozed_until ON public.bills(snoozed_until);