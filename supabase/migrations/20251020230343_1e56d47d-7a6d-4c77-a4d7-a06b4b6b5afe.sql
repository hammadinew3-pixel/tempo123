-- Ajouter une politique pour permettre aux admins de créer des subscriptions pour leur tenant
CREATE POLICY "Admins can insert subscriptions for their tenant"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Permettre aussi aux admins de mettre à jour les subscriptions de leur tenant (pour le paiement)
CREATE POLICY "Admins can update their tenant subscriptions"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);