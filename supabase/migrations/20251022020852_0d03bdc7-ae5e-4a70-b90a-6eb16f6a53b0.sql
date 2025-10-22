-- ATTENTION : Cette migration active la suppression en cascade
-- Supprimer un tenant supprimera automatiquement TOUTES ses données

-- user_roles
ALTER TABLE public.user_roles 
  DROP CONSTRAINT IF EXISTS user_roles_tenant_id_fkey,
  ADD CONSTRAINT user_roles_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- clients
ALTER TABLE public.clients 
  DROP CONSTRAINT IF EXISTS clients_tenant_id_fkey,
  ADD CONSTRAINT clients_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- vehicles
ALTER TABLE public.vehicles 
  DROP CONSTRAINT IF EXISTS vehicles_tenant_id_fkey,
  ADD CONSTRAINT vehicles_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- contracts
ALTER TABLE public.contracts 
  DROP CONSTRAINT IF EXISTS contracts_tenant_id_fkey,
  ADD CONSTRAINT contracts_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- assistance
ALTER TABLE public.assistance 
  DROP CONSTRAINT IF EXISTS assistance_tenant_id_fkey,
  ADD CONSTRAINT assistance_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- vehicle_insurance
ALTER TABLE public.vehicle_insurance 
  DROP CONSTRAINT IF EXISTS vehicle_insurance_tenant_id_fkey,
  ADD CONSTRAINT vehicle_insurance_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- vehicle_technical_inspection
ALTER TABLE public.vehicle_technical_inspection 
  DROP CONSTRAINT IF EXISTS vehicle_technical_inspection_tenant_id_fkey,
  ADD CONSTRAINT vehicle_technical_inspection_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- vehicle_vignette
ALTER TABLE public.vehicle_vignette 
  DROP CONSTRAINT IF EXISTS vehicle_vignette_tenant_id_fkey,
  ADD CONSTRAINT vehicle_vignette_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- vehicle_changes
ALTER TABLE public.vehicle_changes 
  DROP CONSTRAINT IF EXISTS vehicle_changes_tenant_id_fkey,
  ADD CONSTRAINT vehicle_changes_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- secondary_drivers
ALTER TABLE public.secondary_drivers 
  DROP CONSTRAINT IF EXISTS secondary_drivers_tenant_id_fkey,
  ADD CONSTRAINT secondary_drivers_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- contract_payments
ALTER TABLE public.contract_payments 
  DROP CONSTRAINT IF EXISTS contract_payments_tenant_id_fkey,
  ADD CONSTRAINT contract_payments_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- expenses
ALTER TABLE public.expenses 
  DROP CONSTRAINT IF EXISTS expenses_tenant_id_fkey,
  ADD CONSTRAINT expenses_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- assurances
ALTER TABLE public.assurances 
  DROP CONSTRAINT IF EXISTS assurances_tenant_id_fkey,
  ADD CONSTRAINT assurances_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- assurance_bareme
ALTER TABLE public.assurance_bareme 
  DROP CONSTRAINT IF EXISTS assurance_bareme_tenant_id_fkey,
  ADD CONSTRAINT assurance_bareme_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- sinistres
ALTER TABLE public.sinistres 
  DROP CONSTRAINT IF EXISTS sinistres_tenant_id_fkey,
  ADD CONSTRAINT sinistres_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- infractions
ALTER TABLE public.infractions 
  DROP CONSTRAINT IF EXISTS infractions_tenant_id_fkey,
  ADD CONSTRAINT infractions_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- vehicules_traites_echeances
ALTER TABLE public.vehicules_traites_echeances 
  DROP CONSTRAINT IF EXISTS vehicules_traites_echeances_tenant_id_fkey,
  ADD CONSTRAINT vehicules_traites_echeances_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- audit_logs
ALTER TABLE public.audit_logs 
  DROP CONSTRAINT IF EXISTS audit_logs_tenant_id_fkey,
  ADD CONSTRAINT audit_logs_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- vehicle_assistance_categories
ALTER TABLE public.vehicle_assistance_categories 
  DROP CONSTRAINT IF EXISTS vehicle_assistance_categories_tenant_id_fkey,
  ADD CONSTRAINT vehicle_assistance_categories_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- infraction_files
ALTER TABLE public.infraction_files 
  DROP CONSTRAINT IF EXISTS infraction_files_tenant_id_fkey,
  ADD CONSTRAINT infraction_files_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- sinistre_files
ALTER TABLE public.sinistre_files 
  DROP CONSTRAINT IF EXISTS sinistre_files_tenant_id_fkey,
  ADD CONSTRAINT sinistre_files_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- vidanges
ALTER TABLE public.vidanges 
  DROP CONSTRAINT IF EXISTS vidanges_tenant_id_fkey,
  ADD CONSTRAINT vidanges_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- vehicules_traite
ALTER TABLE public.vehicules_traite 
  DROP CONSTRAINT IF EXISTS vehicules_traite_tenant_id_fkey,
  ADD CONSTRAINT vehicules_traite_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- vehicle_affectations
ALTER TABLE public.vehicle_affectations 
  DROP CONSTRAINT IF EXISTS vehicle_affectations_tenant_id_fkey,
  ADD CONSTRAINT vehicle_affectations_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- revenus
ALTER TABLE public.revenus 
  DROP CONSTRAINT IF EXISTS revenus_tenant_id_fkey,
  ADD CONSTRAINT revenus_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- cheques
ALTER TABLE public.cheques 
  DROP CONSTRAINT IF EXISTS cheques_tenant_id_fkey,
  ADD CONSTRAINT cheques_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- interventions
ALTER TABLE public.interventions 
  DROP CONSTRAINT IF EXISTS interventions_tenant_id_fkey,
  ADD CONSTRAINT interventions_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- user_tenants
ALTER TABLE public.user_tenants 
  DROP CONSTRAINT IF EXISTS user_tenants_tenant_id_fkey,
  ADD CONSTRAINT user_tenants_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- tenant_settings
ALTER TABLE public.tenant_settings 
  DROP CONSTRAINT IF EXISTS tenant_settings_tenant_id_fkey,
  ADD CONSTRAINT tenant_settings_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- subscriptions
ALTER TABLE public.subscriptions 
  DROP CONSTRAINT IF EXISTS subscriptions_tenant_id_fkey,
  ADD CONSTRAINT subscriptions_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- subscription_requests
ALTER TABLE public.subscription_requests 
  DROP CONSTRAINT IF EXISTS subscription_requests_tenant_id_fkey,
  ADD CONSTRAINT subscription_requests_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;