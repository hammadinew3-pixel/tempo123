-- Add INSERT policy for tenant_settings
CREATE POLICY "Admins can insert their tenant settings"
ON public.tenant_settings
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Add DELETE policy for tenant_settings
CREATE POLICY "Admins can delete their tenant settings"
ON public.tenant_settings
FOR DELETE
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);