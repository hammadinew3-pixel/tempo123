-- Rendre tenant_id optionnel lors des INSERT en le définissant automatiquement
-- Les triggers set_tenant_id_default() existent déjà et gèrent cela
-- Cette migration ajoute des DEFAULT NULL pour que TypeScript génère des types optionnels

-- Note: On ne peut pas utiliser DEFAULT car tenant_id est NOT NULL
-- La solution est de s'assurer que les triggers sont bien actifs sur TOUTES les tables

-- Vérifier et créer les triggers manquants pour toutes les tables avec tenant_id

-- Liste complète des tables qui nécessitent des triggers:
-- vehicles, clients, contracts, assistance, assurances, expenses, revenus, cheques,
-- sinistres, infractions, interventions, vehicules_traite, contract_payments,
-- secondary_drivers, vehicle_affectations, vehicle_changes, vehicle_insurance,
-- vehicle_technical_inspection, vehicle_vignette, vehicules_traites_echeances,
-- infraction_files, sinistre_files, assurance_bareme, vehicle_assistance_categories,
-- user_roles

-- Créer les triggers pour TOUTES les tables
DROP TRIGGER IF EXISTS set_tenant_id_on_vehicles ON public.vehicles;
CREATE TRIGGER set_tenant_id_on_vehicles
  BEFORE INSERT OR UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_clients ON public.clients;
CREATE TRIGGER set_tenant_id_on_clients
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_contracts ON public.contracts;
CREATE TRIGGER set_tenant_id_on_contracts
  BEFORE INSERT OR UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_assistance ON public.assistance;
CREATE TRIGGER set_tenant_id_on_assistance
  BEFORE INSERT OR UPDATE ON public.assistance
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_assurances ON public.assurances;
CREATE TRIGGER set_tenant_id_on_assurances
  BEFORE INSERT OR UPDATE ON public.assurances
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_expenses ON public.expenses;
CREATE TRIGGER set_tenant_id_on_expenses
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_revenus ON public.revenus;
CREATE TRIGGER set_tenant_id_on_revenus
  BEFORE INSERT OR UPDATE ON public.revenus
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_cheques ON public.cheques;
CREATE TRIGGER set_tenant_id_on_cheques
  BEFORE INSERT OR UPDATE ON public.cheques
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_sinistres ON public.sinistres;
CREATE TRIGGER set_tenant_id_on_sinistres
  BEFORE INSERT OR UPDATE ON public.sinistres
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_infractions ON public.infractions;
CREATE TRIGGER set_tenant_id_on_infractions
  BEFORE INSERT OR UPDATE ON public.infractions
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_interventions ON public.interventions;
CREATE TRIGGER set_tenant_id_on_interventions
  BEFORE INSERT OR UPDATE ON public.interventions
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicules_traite ON public.vehicules_traite;
CREATE TRIGGER set_tenant_id_on_vehicules_traite
  BEFORE INSERT OR UPDATE ON public.vehicules_traite
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_contract_payments ON public.contract_payments;
CREATE TRIGGER set_tenant_id_on_contract_payments
  BEFORE INSERT OR UPDATE ON public.contract_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_secondary_drivers ON public.secondary_drivers;
CREATE TRIGGER set_tenant_id_on_secondary_drivers
  BEFORE INSERT OR UPDATE ON public.secondary_drivers
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicle_affectations ON public.vehicle_affectations;
CREATE TRIGGER set_tenant_id_on_vehicle_affectations
  BEFORE INSERT OR UPDATE ON public.vehicle_affectations
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicle_changes ON public.vehicle_changes;
CREATE TRIGGER set_tenant_id_on_vehicle_changes
  BEFORE INSERT OR UPDATE ON public.vehicle_changes
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicle_insurance ON public.vehicle_insurance;
CREATE TRIGGER set_tenant_id_on_vehicle_insurance
  BEFORE INSERT OR UPDATE ON public.vehicle_insurance
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicle_technical_inspection ON public.vehicle_technical_inspection;
CREATE TRIGGER set_tenant_id_on_vehicle_technical_inspection
  BEFORE INSERT OR UPDATE ON public.vehicle_technical_inspection
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicle_vignette ON public.vehicle_vignette;
CREATE TRIGGER set_tenant_id_on_vehicle_vignette
  BEFORE INSERT OR UPDATE ON public.vehicle_vignette
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicules_traites_echeances ON public.vehicules_traites_echeances;
CREATE TRIGGER set_tenant_id_on_vehicules_traites_echeances
  BEFORE INSERT OR UPDATE ON public.vehicules_traites_echeances
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_infraction_files ON public.infraction_files;
CREATE TRIGGER set_tenant_id_on_infraction_files
  BEFORE INSERT OR UPDATE ON public.infraction_files
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_sinistre_files ON public.sinistre_files;
CREATE TRIGGER set_tenant_id_on_sinistre_files
  BEFORE INSERT OR UPDATE ON public.sinistre_files
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_assurance_bareme ON public.assurance_bareme;
CREATE TRIGGER set_tenant_id_on_assurance_bareme
  BEFORE INSERT OR UPDATE ON public.assurance_bareme
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_vehicle_assistance_categories ON public.vehicle_assistance_categories;
CREATE TRIGGER set_tenant_id_on_vehicle_assistance_categories
  BEFORE INSERT OR UPDATE ON public.vehicle_assistance_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();

DROP TRIGGER IF EXISTS set_tenant_id_on_user_roles ON public.user_roles;
CREATE TRIGGER set_tenant_id_on_user_roles
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_default();