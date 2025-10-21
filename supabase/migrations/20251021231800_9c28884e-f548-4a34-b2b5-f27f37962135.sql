-- Vérifier et corriger les RLS policies pour la table expenses
-- Permettre aux admins de supprimer les dépenses

-- D'abord, vérifier si la policy existe déjà
DO $$ 
BEGIN
  -- Supprimer l'ancienne policy si elle existe
  DROP POLICY IF EXISTS "Admins can delete expenses in their tenant" ON public.expenses;
  
  -- Créer la nouvelle policy pour permettre aux admins de supprimer
  CREATE POLICY "Admins can delete expenses in their tenant"
  ON public.expenses
  FOR DELETE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND tenant_is_active(auth.uid()) = true 
    AND has_role(auth.uid(), 'admin'::app_role)
  );
END $$;