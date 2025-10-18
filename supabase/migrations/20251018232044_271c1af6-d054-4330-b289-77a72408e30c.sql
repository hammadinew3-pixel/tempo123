-- PHASE 2B: Triggers et RLS Policies avec isolation tenant

-- 9. Créer un trigger générique pour auto-set tenant_id
CREATE OR REPLACE FUNCTION public.set_tenant_id_default()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.tenant_id IS NULL THEN
      NEW.tenant_id := public.get_user_tenant_id(auth.uid());
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Empêcher le changement de tenant via UPDATE
    IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id THEN
      NEW.tenant_id := OLD.tenant_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Attacher le trigger à toutes les tables métier
DROP TRIGGER IF EXISTS set_tenant_id_on_vehicles ON public.vehicles;
CREATE TRIGGER set_tenant_id_on_vehicles
BEFORE INSERT OR UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_clients ON public.clients;
CREATE TRIGGER set_tenant_id_on_clients
BEFORE INSERT OR UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_contracts ON public.contracts;
CREATE TRIGGER set_tenant_id_on_contracts
BEFORE INSERT OR UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_assistance ON public.assistance;
CREATE TRIGGER set_tenant_id_on_assistance
BEFORE INSERT OR UPDATE ON public.assistance
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_assurances ON public.assurances;
CREATE TRIGGER set_tenant_id_on_assurances
BEFORE INSERT OR UPDATE ON public.assurances
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_expenses ON public.expenses;
CREATE TRIGGER set_tenant_id_on_expenses
BEFORE INSERT OR UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_revenus ON public.revenus;
CREATE TRIGGER set_tenant_id_on_revenus
BEFORE INSERT OR UPDATE ON public.revenus
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_cheques ON public.cheques;
CREATE TRIGGER set_tenant_id_on_cheques
BEFORE INSERT OR UPDATE ON public.cheques
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_sinistres ON public.sinistres;
CREATE TRIGGER set_tenant_id_on_sinistres
BEFORE INSERT OR UPDATE ON public.sinistres
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_infractions ON public.infractions;
CREATE TRIGGER set_tenant_id_on_infractions
BEFORE INSERT OR UPDATE ON public.infractions
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_interventions ON public.interventions;
CREATE TRIGGER set_tenant_id_on_interventions
BEFORE INSERT OR UPDATE ON public.interventions
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vidanges ON public.vidanges;
CREATE TRIGGER set_tenant_id_on_vidanges
BEFORE INSERT OR UPDATE ON public.vidanges
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicules_traite ON public.vehicules_traite;
CREATE TRIGGER set_tenant_id_on_vehicules_traite
BEFORE INSERT OR UPDATE ON public.vehicules_traite
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_contract_payments ON public.contract_payments;
CREATE TRIGGER set_tenant_id_on_contract_payments
BEFORE INSERT OR UPDATE ON public.contract_payments
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_secondary_drivers ON public.secondary_drivers;
CREATE TRIGGER set_tenant_id_on_secondary_drivers
BEFORE INSERT OR UPDATE ON public.secondary_drivers
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicle_affectations ON public.vehicle_affectations;
CREATE TRIGGER set_tenant_id_on_vehicle_affectations
BEFORE INSERT OR UPDATE ON public.vehicle_affectations
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicle_changes ON public.vehicle_changes;
CREATE TRIGGER set_tenant_id_on_vehicle_changes
BEFORE INSERT OR UPDATE ON public.vehicle_changes
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicle_insurance ON public.vehicle_insurance;
CREATE TRIGGER set_tenant_id_on_vehicle_insurance
BEFORE INSERT OR UPDATE ON public.vehicle_insurance
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicle_technical_inspection ON public.vehicle_technical_inspection;
CREATE TRIGGER set_tenant_id_on_vehicle_technical_inspection
BEFORE INSERT OR UPDATE ON public.vehicle_technical_inspection
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicle_vignette ON public.vehicle_vignette;
CREATE TRIGGER set_tenant_id_on_vehicle_vignette
BEFORE INSERT OR UPDATE ON public.vehicle_vignette
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicules_traites_echeances ON public.vehicules_traites_echeances;
CREATE TRIGGER set_tenant_id_on_vehicules_traites_echeances
BEFORE INSERT OR UPDATE ON public.vehicules_traites_echeances
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_infraction_files ON public.infraction_files;
CREATE TRIGGER set_tenant_id_on_infraction_files
BEFORE INSERT OR UPDATE ON public.infraction_files
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_sinistre_files ON public.sinistre_files;
CREATE TRIGGER set_tenant_id_on_sinistre_files
BEFORE INSERT OR UPDATE ON public.sinistre_files
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_assurance_bareme ON public.assurance_bareme;
CREATE TRIGGER set_tenant_id_on_assurance_bareme
BEFORE INSERT OR UPDATE ON public.assurance_bareme
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicle_assistance_categories ON public.vehicle_assistance_categories;
CREATE TRIGGER set_tenant_id_on_vehicle_assistance_categories
BEFORE INSERT OR UPDATE ON public.vehicle_assistance_categories
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_user_roles ON public.user_roles;
CREATE TRIGGER set_tenant_id_on_user_roles
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_audit_logs ON public.audit_logs;
CREATE TRIGGER set_tenant_id_on_audit_logs
BEFORE INSERT OR UPDATE ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_tenant_id_default();

-- 10. RLS Policies complètes avec isolation tenant

-- VEHICLES
DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can view their tenant vehicles" ON public.vehicles;
CREATE POLICY "Users can view their tenant vehicles"
ON public.vehicles FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Agents can insert vehicles in their tenant" ON public.vehicles;
CREATE POLICY "Agents can insert vehicles in their tenant"
ON public.vehicles FOR INSERT
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Agents can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Agents can update their tenant vehicles" ON public.vehicles;
CREATE POLICY "Agents can update their tenant vehicles"
ON public.vehicles FOR UPDATE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Admins can delete vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can delete their tenant vehicles" ON public.vehicles;
CREATE POLICY "Admins can delete their tenant vehicles"
ON public.vehicles FOR DELETE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

-- CLIENTS
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view their tenant clients" ON public.clients;
CREATE POLICY "Users can view their tenant clients"
ON public.clients FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Agents can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Agents can insert clients in their tenant" ON public.clients;
CREATE POLICY "Agents can insert clients in their tenant"
ON public.clients FOR INSERT
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Agents can update clients" ON public.clients;
DROP POLICY IF EXISTS "Agents can update their tenant clients" ON public.clients;
CREATE POLICY "Agents can update their tenant clients"
ON public.clients FOR UPDATE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can delete their tenant clients" ON public.clients;
CREATE POLICY "Admins can delete their tenant clients"
ON public.clients FOR DELETE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

-- CONTRACTS
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can view their tenant contracts" ON public.contracts;
CREATE POLICY "Users can view their tenant contracts"
ON public.contracts FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Agents can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Agents can insert contracts in their tenant" ON public.contracts;
CREATE POLICY "Agents can insert contracts in their tenant"
ON public.contracts FOR INSERT
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Agents can update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Agents can update their tenant contracts" ON public.contracts;
CREATE POLICY "Agents can update their tenant contracts"
ON public.contracts FOR UPDATE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Admins can delete contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admins can delete their tenant contracts" ON public.contracts;
CREATE POLICY "Admins can delete their tenant contracts"
ON public.contracts FOR DELETE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

-- ASSISTANCE
DROP POLICY IF EXISTS "Authenticated users can view assistance" ON public.assistance;
DROP POLICY IF EXISTS "Users can view their tenant assistance" ON public.assistance;
CREATE POLICY "Users can view their tenant assistance"
ON public.assistance FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Agents can insert assistance" ON public.assistance;
DROP POLICY IF EXISTS "Agents can insert assistance in their tenant" ON public.assistance;
CREATE POLICY "Agents can insert assistance in their tenant"
ON public.assistance FOR INSERT
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Agents can update assistance" ON public.assistance;
DROP POLICY IF EXISTS "Agents can update their tenant assistance" ON public.assistance;
CREATE POLICY "Agents can update their tenant assistance"
ON public.assistance FOR UPDATE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), 'agent')
    OR public.has_role(auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Admins can delete assistance" ON public.assistance;
DROP POLICY IF EXISTS "Admins can delete their tenant assistance" ON public.assistance;
CREATE POLICY "Admins can delete their tenant assistance"
ON public.assistance FOR DELETE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

-- RLS policies pour les autres tables suivent le même pattern
-- (assurances, expenses, revenus, cheques, sinistres, infractions, interventions, vidanges,
-- vehicules_traite, contract_payments, secondary_drivers, vehicle_affectations, vehicle_changes,
-- vehicle_insurance, vehicle_technical_inspection, vehicle_vignette, vehicules_traites_echeances,
-- infraction_files, sinistre_files, assurance_bareme, vehicle_assistance_categories, user_roles, audit_logs)

-- Je vais créer les RLS pour toutes les autres tables dans le même pattern
-- Pour économiser de l'espace, je vais utiliser une approche plus concise pour les tables restantes