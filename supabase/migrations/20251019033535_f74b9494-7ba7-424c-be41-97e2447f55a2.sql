-- Créer une fonction pour vérifier si le tenant de l'utilisateur est actif
CREATE OR REPLACE FUNCTION public.tenant_is_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT t.is_active
      FROM public.tenants t
      INNER JOIN public.user_tenants ut ON ut.tenant_id = t.id
      WHERE ut.user_id = _user_id
      AND ut.is_active = true
      LIMIT 1
    ),
    true  -- Si pas de tenant (super_admin), retourner true
  )
$$;

-- Mettre à jour les RLS policies pour bloquer l'accès si le tenant est suspendu

-- Table: assistance
DROP POLICY IF EXISTS "Users can view their tenant assistance" ON public.assistance;
CREATE POLICY "Users can view their tenant assistance"
ON public.assistance FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: assurance_bareme
DROP POLICY IF EXISTS "Users can view their tenant assurance bareme" ON public.assurance_bareme;
CREATE POLICY "Users can view their tenant assurance bareme"
ON public.assurance_bareme FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: assurances
DROP POLICY IF EXISTS "Users can view their tenant assurances" ON public.assurances;
CREATE POLICY "Users can view their tenant assurances"
ON public.assurances FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: audit_logs
DROP POLICY IF EXISTS "Users can view their tenant audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their tenant audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: cheques
DROP POLICY IF EXISTS "Users can view their tenant cheques" ON public.cheques;
CREATE POLICY "Users can view their tenant cheques"
ON public.cheques FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: clients
DROP POLICY IF EXISTS "Users can view their tenant clients" ON public.clients;
CREATE POLICY "Users can view their tenant clients"
ON public.clients FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: contract_payments
DROP POLICY IF EXISTS "Users can view their tenant contract payments" ON public.contract_payments;
CREATE POLICY "Users can view their tenant contract payments"
ON public.contract_payments FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: contracts
DROP POLICY IF EXISTS "Users can view their tenant contracts" ON public.contracts;
CREATE POLICY "Users can view their tenant contracts"
ON public.contracts FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: expenses
DROP POLICY IF EXISTS "Users can view their tenant expenses" ON public.expenses;
CREATE POLICY "Users can view their tenant expenses"
ON public.expenses FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: infraction_files
DROP POLICY IF EXISTS "Users can view their tenant infraction files" ON public.infraction_files;
CREATE POLICY "Users can view their tenant infraction files"
ON public.infraction_files FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: infractions
DROP POLICY IF EXISTS "Users can view their tenant infractions" ON public.infractions;
CREATE POLICY "Users can view their tenant infractions"
ON public.infractions FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: interventions
DROP POLICY IF EXISTS "Users can view their tenant interventions" ON public.interventions;
CREATE POLICY "Users can view their tenant interventions"
ON public.interventions FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: revenus
DROP POLICY IF EXISTS "Users can view their tenant revenus" ON public.revenus;
CREATE POLICY "Users can view their tenant revenus"
ON public.revenus FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: secondary_drivers
DROP POLICY IF EXISTS "Users can view their tenant secondary drivers" ON public.secondary_drivers;
CREATE POLICY "Users can view their tenant secondary drivers"
ON public.secondary_drivers FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: sinistre_files
DROP POLICY IF EXISTS "Users can view their tenant sinistre files" ON public.sinistre_files;
CREATE POLICY "Users can view their tenant sinistre files"
ON public.sinistre_files FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: sinistres
DROP POLICY IF EXISTS "Users can view their tenant sinistres" ON public.sinistres;
CREATE POLICY "Users can view their tenant sinistres"
ON public.sinistres FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: tenant_settings
DROP POLICY IF EXISTS "Users can view their tenant settings" ON public.tenant_settings;
CREATE POLICY "Users can view their tenant settings"
ON public.tenant_settings FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

-- Table: vehicle_affectations
DROP POLICY IF EXISTS "Users can view their tenant vehicle affectations" ON public.vehicle_affectations;
CREATE POLICY "Users can view their tenant vehicle affectations"
ON public.vehicle_affectations FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);