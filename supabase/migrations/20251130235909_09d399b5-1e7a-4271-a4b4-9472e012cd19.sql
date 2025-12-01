-- Add billing cycle tracking fields for day-based calculations
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS billing_cycle_days integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS grace_period_days integer DEFAULT 21,
ADD COLUMN IF NOT EXISTS last_statement_date date;