-- Permettre aux super admins de supprimer des tenants
CREATE POLICY "Super admins can delete tenants"
ON public.tenants
FOR DELETE
USING (is_super_admin(auth.uid()));