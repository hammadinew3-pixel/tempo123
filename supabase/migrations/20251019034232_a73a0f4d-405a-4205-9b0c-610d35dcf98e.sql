-- Mettre à jour les policies de vehicles pour inclure tenant_is_active

DROP POLICY IF EXISTS "Users can view their tenant vehicles" ON public.vehicles;
CREATE POLICY "Users can view their tenant vehicles"
ON public.vehicles FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND tenant_is_active(auth.uid()) = true
);

DROP POLICY IF EXISTS "Agents can insert vehicles in their tenant" ON public.vehicles;
CREATE POLICY "Agents can insert vehicles in their tenant"
ON public.vehicles FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND tenant_is_active(auth.uid()) = true
  AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

DROP POLICY IF EXISTS "Agents can update their tenant vehicles" ON public.vehicles;
CREATE POLICY "Agents can update their tenant vehicles"
ON public.vehicles FOR UPDATE
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND tenant_is_active(auth.uid()) = true
  AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND tenant_is_active(auth.uid()) = true
  AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

DROP POLICY IF EXISTS "Admins can delete their tenant vehicles" ON public.vehicles;
CREATE POLICY "Admins can delete their tenant vehicles"
ON public.vehicles FOR DELETE
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND tenant_is_active(auth.uid()) = true
  AND has_role(auth.uid(), 'admin'::app_role)
);
