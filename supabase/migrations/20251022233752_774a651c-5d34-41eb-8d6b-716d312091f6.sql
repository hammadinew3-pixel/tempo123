-- Policy pour INSERT : Les admins peuvent créer les settings de leur tenant
CREATE POLICY "Admins can insert their tenant settings"
ON agence_settings
FOR INSERT
TO authenticated
WITH CHECK (
  id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Policy pour UPDATE : Les admins peuvent modifier les settings de leur tenant
CREATE POLICY "Admins can update their tenant settings"
ON agence_settings
FOR UPDATE
TO authenticated
USING (
  id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Policy pour DELETE : Les admins peuvent supprimer les settings de leur tenant
CREATE POLICY "Admins can delete their tenant settings"
ON agence_settings
FOR DELETE
TO authenticated
USING (
  id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);