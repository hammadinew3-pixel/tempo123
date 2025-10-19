-- Ajouter la colonne plan_id avec foreign key vers plans
ALTER TABLE public.tenants
ADD COLUMN plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;

-- Créer un index pour optimiser les requêtes
CREATE INDEX idx_tenants_plan_id ON public.tenants(plan_id);

-- Mettre à jour la RLS policy pour permettre aux admins de modifier plan_id
DROP POLICY IF EXISTS "Admins can update their tenant" ON public.tenants;
CREATE POLICY "Admins can update their tenant"
ON public.tenants FOR UPDATE
TO authenticated
USING (
  id = get_user_tenant_id(auth.uid())
  AND tenant_is_active(auth.uid()) = true
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  id = get_user_tenant_id(auth.uid())
  AND tenant_is_active(auth.uid()) = true
  AND has_role(auth.uid(), 'admin'::app_role)
);