-- Add paid_at column to track when user confirmed payment
ALTER TABLE public.bills ADD COLUMN paid_at timestamp with time zone;