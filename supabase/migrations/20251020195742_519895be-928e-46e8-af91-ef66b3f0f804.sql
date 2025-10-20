-- Allow users to view all active plans (needed for requesting plan changes)
CREATE POLICY "Users can view all active plans"
ON public.plans
FOR SELECT
USING (is_active = true);