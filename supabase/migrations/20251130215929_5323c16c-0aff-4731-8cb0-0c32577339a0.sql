-- Add frequency column for recurring bills
ALTER TABLE public.bills 
ADD COLUMN frequency text NOT NULL DEFAULT 'monthly';

-- Add comment for clarity
COMMENT ON COLUMN public.bills.frequency IS 'Billing frequency: weekly, biweekly, monthly, yearly';

-- Create index for frequency queries
CREATE INDEX idx_bills_frequency ON public.bills(frequency);