-- Supprimer le tenant "hammadianouar's Agency" et toutes ses données associées
DO $$
DECLARE
  tenant_to_delete UUID;
BEGIN
  -- Récupérer l'ID du tenant à supprimer
  SELECT id INTO tenant_to_delete
  FROM public.tenants
  WHERE name = 'hammadianouar''s Agency';

  IF tenant_to_delete IS NOT NULL THEN
    -- Supprimer toutes les données liées au tenant
    DELETE FROM public.assistance WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.assurance_bareme WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.assurances WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.audit_logs WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.cheques WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.clients WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.contract_payments WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.contracts WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.expenses WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.infraction_files WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.infractions WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.interventions WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.revenus WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.secondary_drivers WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.sinistre_files WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.sinistres WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.vehicle_affectations WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.vehicle_assistance_categories WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.vehicle_changes WHERE tenant_id = tenant_to_delete;
    DELETE FROM public.vehicles WHERE tenant_id = tenant_to_delete;
    
    -- Supprimer les settings du tenant
    DELETE FROM public.tenant_settings WHERE tenant_id = tenant_to_delete;
    
    -- Supprimer les rôles liés au tenant
    DELETE FROM public.user_roles WHERE tenant_id = tenant_to_delete;
    
    -- Supprimer les associations utilisateur-tenant
    DELETE FROM public.user_tenants WHERE tenant_id = tenant_to_delete;
    
    -- Supprimer le tenant lui-même
    DELETE FROM public.tenants WHERE id = tenant_to_delete;
    
    RAISE NOTICE 'Tenant "hammadianouar''s Agency" et toutes ses données ont été supprimés avec succès';
  ELSE
    RAISE NOTICE 'Tenant "hammadianouar''s Agency" non trouvé';
  END IF;
END $$;