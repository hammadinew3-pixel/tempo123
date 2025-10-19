-- ============================================
-- VEHICLE_INSURANCE POLICIES
-- ============================================
CREATE POLICY "Agents can insert vehicle insurance in their tenant"
ON public.vehicle_insurance
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update vehicle insurance in their tenant"
ON public.vehicle_insurance
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete vehicle insurance in their tenant"
ON public.vehicle_insurance
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- VEHICLE_TECHNICAL_INSPECTION POLICIES
-- ============================================
CREATE POLICY "Agents can insert technical inspections in their tenant"
ON public.vehicle_technical_inspection
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update technical inspections in their tenant"
ON public.vehicle_technical_inspection
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete technical inspections in their tenant"
ON public.vehicle_technical_inspection
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- VEHICLE_VIGNETTE POLICIES
-- ============================================
CREATE POLICY "Agents can insert vignettes in their tenant"
ON public.vehicle_vignette
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update vignettes in their tenant"
ON public.vehicle_vignette
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete vignettes in their tenant"
ON public.vehicle_vignette
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- INTERVENTIONS POLICIES
-- ============================================
CREATE POLICY "Agents can insert interventions in their tenant"
ON public.interventions
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update interventions in their tenant"
ON public.interventions
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete interventions in their tenant"
ON public.interventions
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- EXPENSES POLICIES
-- ============================================
CREATE POLICY "Agents can insert expenses in their tenant"
ON public.expenses
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update expenses in their tenant"
ON public.expenses
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete expenses in their tenant"
ON public.expenses
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- REVENUS POLICIES
-- ============================================
CREATE POLICY "Agents can insert revenus in their tenant"
ON public.revenus
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update revenus in their tenant"
ON public.revenus
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete revenus in their tenant"
ON public.revenus
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- CHEQUES POLICIES
-- ============================================
CREATE POLICY "Agents can insert cheques in their tenant"
ON public.cheques
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update cheques in their tenant"
ON public.cheques
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete cheques in their tenant"
ON public.cheques
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- INFRACTIONS POLICIES
-- ============================================
CREATE POLICY "Agents can insert infractions in their tenant"
ON public.infractions
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update infractions in their tenant"
ON public.infractions
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete infractions in their tenant"
ON public.infractions
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- SINISTRES POLICIES
-- ============================================
CREATE POLICY "Agents can insert sinistres in their tenant"
ON public.sinistres
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update sinistres in their tenant"
ON public.sinistres
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete sinistres in their tenant"
ON public.sinistres
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- CONTRACT_PAYMENTS POLICIES
-- ============================================
CREATE POLICY "Agents can insert contract payments in their tenant"
ON public.contract_payments
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update contract payments in their tenant"
ON public.contract_payments
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete contract payments in their tenant"
ON public.contract_payments
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- SECONDARY_DRIVERS POLICIES
-- ============================================
CREATE POLICY "Agents can insert secondary drivers in their tenant"
ON public.secondary_drivers
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update secondary drivers in their tenant"
ON public.secondary_drivers
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete secondary drivers in their tenant"
ON public.secondary_drivers
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- VEHICLE_CHANGES POLICIES
-- ============================================
CREATE POLICY "Agents can insert vehicle changes in their tenant"
ON public.vehicle_changes
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update vehicle changes in their tenant"
ON public.vehicle_changes
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete vehicle changes in their tenant"
ON public.vehicle_changes
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- VEHICLE_AFFECTATIONS POLICIES
-- ============================================
CREATE POLICY "Agents can insert vehicle affectations in their tenant"
ON public.vehicle_affectations
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update vehicle affectations in their tenant"
ON public.vehicle_affectations
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete vehicle affectations in their tenant"
ON public.vehicle_affectations
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- INFRACTION_FILES POLICIES
-- ============================================
CREATE POLICY "Agents can insert infraction files in their tenant"
ON public.infraction_files
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update infraction files in their tenant"
ON public.infraction_files
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete infraction files in their tenant"
ON public.infraction_files
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- SINISTRE_FILES POLICIES
-- ============================================
CREATE POLICY "Agents can insert sinistre files in their tenant"
ON public.sinistre_files
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update sinistre files in their tenant"
ON public.sinistre_files
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete sinistre files in their tenant"
ON public.sinistre_files
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- VEHICULES_TRAITE POLICIES
-- ============================================
CREATE POLICY "Agents can insert vehicules traite in their tenant"
ON public.vehicules_traite
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update vehicules traite in their tenant"
ON public.vehicules_traite
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete vehicules traite in their tenant"
ON public.vehicules_traite
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- VEHICULES_TRAITES_ECHEANCES POLICIES
-- ============================================
CREATE POLICY "Agents can insert traites echeances in their tenant"
ON public.vehicules_traites_echeances
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update traites echeances in their tenant"
ON public.vehicules_traites_echeances
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete traites echeances in their tenant"
ON public.vehicules_traites_echeances
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- ASSURANCES POLICIES
-- ============================================
CREATE POLICY "Agents can insert assurances in their tenant"
ON public.assurances
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update assurances in their tenant"
ON public.assurances
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete assurances in their tenant"
ON public.assurances
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- ASSURANCE_BAREME POLICIES
-- ============================================
CREATE POLICY "Agents can insert assurance bareme in their tenant"
ON public.assurance_bareme
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update assurance bareme in their tenant"
ON public.assurance_bareme
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete assurance bareme in their tenant"
ON public.assurance_bareme
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- ============================================
-- VEHICLE_ASSISTANCE_CATEGORIES POLICIES
-- ============================================
CREATE POLICY "Agents can insert assistance categories in their tenant"
ON public.vehicle_assistance_categories
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Agents can update assistance categories in their tenant"
ON public.vehicle_assistance_categories
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND (has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can delete assistance categories in their tenant"
ON public.vehicle_assistance_categories
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);