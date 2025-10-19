-- Allow tenant users to view ONLY the plan assigned to their tenant
-- This fixes the issue where JOIN tenants -> plans returned null due to restrictive RLS on plans

-- Create or replace a policy scoped to the authenticated user's tenant
DO $$
BEGIN
  -- Drop existing policy if a conflicting one exists to avoid duplicates
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'plans' 
      AND policyname = 'Users can view their tenant plan'
  ) THEN
    DROP POLICY "Users can view their tenant plan" ON public.plans;
  END IF;
END $$;

CREATE POLICY "Users can view their tenant plan"
ON public.plans
FOR SELECT
TO authenticated
USING (
  -- Allow select only when this plan is the one assigned to the user's active tenant
  id = (
    SELECT t.plan_id
    FROM public.tenants t
    WHERE t.id = get_user_tenant_id(auth.uid())
  )
);
