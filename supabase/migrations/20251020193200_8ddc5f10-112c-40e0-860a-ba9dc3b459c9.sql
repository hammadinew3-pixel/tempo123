-- Create subscriptions table to track tenant subscriptions with duration
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  duration integer NOT NULL CHECK (duration IN (6, 12)), -- Duration in months: 6 or 12
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_is_active ON public.subscriptions(is_active);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Super admins can view all subscriptions
CREATE POLICY "Super admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (is_super_admin(auth.uid()));

-- Super admins can insert subscriptions
CREATE POLICY "Super admins can insert subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()));

-- Super admins can update subscriptions
CREATE POLICY "Super admins can update subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Super admins can delete subscriptions
CREATE POLICY "Super admins can delete subscriptions"
  ON public.subscriptions
  FOR DELETE
  USING (is_super_admin(auth.uid()));

-- Users can view their tenant's subscription
CREATE POLICY "Users can view their tenant subscription"
  ON public.subscriptions
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Trigger to update updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.subscriptions IS 'Stores tenant subscription details including duration and expiration dates';