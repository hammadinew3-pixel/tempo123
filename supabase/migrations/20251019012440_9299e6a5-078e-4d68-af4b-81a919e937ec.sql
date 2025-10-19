-- Corriger l'isolation par tenant pour toutes les tables

-- 1. Infractions
DROP POLICY IF EXISTS "Authenticated users can view infractions" ON public.infractions;
CREATE POLICY "Users can view their tenant infractions"
ON public.infractions
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 2. Assurance bareme
DROP POLICY IF EXISTS "Authenticated users can view bareme" ON public.assurance_bareme;
CREATE POLICY "Users can view their tenant assurance bareme"
ON public.assurance_bareme
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 3. Assurances
DROP POLICY IF EXISTS "Authenticated users can view assurances" ON public.assurances;
CREATE POLICY "Users can view their tenant assurances"
ON public.assurances
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 4. Cheques
DROP POLICY IF EXISTS "Authenticated users can view cheques" ON public.cheques;
CREATE POLICY "Users can view their tenant cheques"
ON public.cheques
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 5. Contract payments
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.contract_payments;
CREATE POLICY "Users can view their tenant contract payments"
ON public.contract_payments
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 6. Infraction files
DROP POLICY IF EXISTS "Authenticated users can view infraction files" ON public.infraction_files;
CREATE POLICY "Users can view their tenant infraction files"
ON public.infraction_files
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 7. Interventions
DROP POLICY IF EXISTS "Authenticated users can view interventions" ON public.interventions;
CREATE POLICY "Users can view their tenant interventions"
ON public.interventions
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 8. Revenus
DROP POLICY IF EXISTS "Authenticated users can view revenus" ON public.revenus;
CREATE POLICY "Users can view their tenant revenus"
ON public.revenus
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 9. Secondary drivers
DROP POLICY IF EXISTS "Authenticated users can view secondary drivers" ON public.secondary_drivers;
CREATE POLICY "Users can view their tenant secondary drivers"
ON public.secondary_drivers
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 10. Sinistres
DROP POLICY IF EXISTS "Authenticated users can view sinistres" ON public.sinistres;
CREATE POLICY "Users can view their tenant sinistres"
ON public.sinistres
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 11. Sinistre files
DROP POLICY IF EXISTS "Authenticated users can view sinistre files" ON public.sinistre_files;
CREATE POLICY "Users can view their tenant sinistre files"
ON public.sinistre_files
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 12. Vehicle affectations
DROP POLICY IF EXISTS "Authenticated users can view vehicle affectations" ON public.vehicle_affectations;
CREATE POLICY "Users can view their tenant vehicle affectations"
ON public.vehicle_affectations
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 13. Vehicle assistance categories
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.vehicle_assistance_categories;
CREATE POLICY "Users can view their tenant assistance categories"
ON public.vehicle_assistance_categories
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 14. Vehicle changes
DROP POLICY IF EXISTS "Authenticated users can view vehicle changes" ON public.vehicle_changes;
CREATE POLICY "Users can view their tenant vehicle changes"
ON public.vehicle_changes
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));