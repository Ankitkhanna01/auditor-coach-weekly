-- Add policy for service role to read all subscriptions (for background notifications)
CREATE POLICY "Service role can read all subscriptions"
ON public.push_subscriptions
FOR SELECT
TO service_role
USING (true);

-- Add policy for service role to read all bills (for background notifications)
CREATE POLICY "Service role can read all bills"
ON public.bills
FOR SELECT
TO service_role
USING (true);