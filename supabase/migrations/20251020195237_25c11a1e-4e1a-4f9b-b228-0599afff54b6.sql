-- Create subscription_requests table
CREATE TABLE public.subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  current_plan_id uuid REFERENCES public.plans(id),
  requested_plan_id uuid NOT NULL REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id),
  notes text
);

-- Enable RLS
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their tenant subscription requests
CREATE POLICY "Users can view their tenant subscription requests"
ON public.subscription_requests
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Admins can insert subscription requests in their tenant
CREATE POLICY "Admins can insert subscription requests in their tenant"
ON public.subscription_requests
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Super admins can view all subscription requests
CREATE POLICY "Super admins can view all subscription requests"
ON public.subscription_requests
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Super admins can update subscription requests
CREATE POLICY "Super admins can update subscription requests"
ON public.subscription_requests
FOR UPDATE
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Super admins can delete subscription requests
CREATE POLICY "Super admins can delete subscription requests"
ON public.subscription_requests
FOR DELETE
USING (is_super_admin(auth.uid()));