-- PHASE 2A: Créer l'infrastructure multi-tenant

-- 1.1 Créer la table tenants
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  subscription_plan TEXT DEFAULT 'basic',
  max_vehicles INTEGER DEFAULT 50,
  max_users INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Créer la table user_tenants (liaison utilisateur-tenant)
CREATE TABLE IF NOT EXISTS public.user_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- 1.3 Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON public.user_tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON public.user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_active ON public.user_tenants(user_id, is_active);

-- 1.4 Trigger pour updated_at sur tenants
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at 
  BEFORE UPDATE ON public.tenants 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 1.5 RLS sur tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenants" ON public.tenants;
CREATE POLICY "Users can view their tenants"
ON public.tenants FOR SELECT
USING (
  id IN (
    SELECT tenant_id 
    FROM public.user_tenants 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 1.6 RLS sur user_tenants
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tenant associations" ON public.user_tenants;
CREATE POLICY "Users can view their own tenant associations"
ON public.user_tenants FOR SELECT
USING (user_id = auth.uid());

-- 2. Créer les fonctions helper sécurisées
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id 
  FROM public.user_tenants 
  WHERE user_id = _user_id 
  AND is_active = true
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_tenants 
    WHERE user_id = _user_id 
    AND tenant_id = _tenant_id
    AND is_active = true
  )
$$;

-- 3. Ajouter tenant_id à TOUTES les tables métier (nullable pour migration)
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.assistance ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.assurances ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.revenus ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.cheques ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.sinistres ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.infractions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.interventions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.vidanges ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.vehicules_traite ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.contract_payments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.secondary_drivers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.vehicle_affectations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.vehicle_changes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.vehicle_insurance ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.vehicle_technical_inspection ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.vehicle_vignette ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.vehicules_traites_echeances ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.infraction_files ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.sinistre_files ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.assurance_bareme ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.vehicle_assistance_categories ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Créer les index pour performance
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON public.vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_id ON public.contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assistance_tenant_id ON public.assistance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assurances_tenant_id ON public.assurances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON public.expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenus_tenant_id ON public.revenus(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cheques_tenant_id ON public.cheques(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sinistres_tenant_id ON public.sinistres(tenant_id);
CREATE INDEX IF NOT EXISTS idx_infractions_tenant_id ON public.infractions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_interventions_tenant_id ON public.interventions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vidanges_tenant_id ON public.vidanges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicules_traite_tenant_id ON public.vehicules_traite(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_payments_tenant_id ON public.contract_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_secondary_drivers_tenant_id ON public.secondary_drivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_affectations_tenant_id ON public.vehicle_affectations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_changes_tenant_id ON public.vehicle_changes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_insurance_tenant_id ON public.vehicle_insurance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_technical_inspection_tenant_id ON public.vehicle_technical_inspection(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_vignette_tenant_id ON public.vehicle_vignette(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicules_traites_echeances_tenant_id ON public.vehicules_traites_echeances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_infraction_files_tenant_id ON public.infraction_files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sinistre_files_tenant_id ON public.sinistre_files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assurance_bareme_tenant_id ON public.assurance_bareme(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assistance_categories_tenant_id ON public.vehicle_assistance_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON public.user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);

-- 4. Créer le tenant par défaut et migrer les données
DO $$
DECLARE
  default_tenant_id UUID;
BEGIN
  -- Créer le tenant par défaut
  INSERT INTO public.tenants (name, slug, is_active, subscription_plan)
  VALUES ('Agence Principale', 'default-agency', true, 'enterprise')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO default_tenant_id;
  
  -- Si le tenant existait déjà, le récupérer
  IF default_tenant_id IS NULL THEN
    SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'default-agency';
  END IF;
  
  -- Lier tous les utilisateurs existants au tenant par défaut
  INSERT INTO public.user_tenants (user_id, tenant_id, is_active)
  SELECT id, default_tenant_id, true
  FROM auth.users
  ON CONFLICT (user_id, tenant_id) DO NOTHING;
  
  -- Mettre à jour toutes les tables métier avec le tenant par défaut
  UPDATE public.vehicles SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.clients SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.contracts SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.assistance SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.assurances SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.expenses SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.revenus SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.cheques SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.sinistres SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.infractions SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.interventions SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.vidanges SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.vehicules_traite SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.contract_payments SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.secondary_drivers SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.vehicle_affectations SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.vehicle_changes SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.vehicle_insurance SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.vehicle_technical_inspection SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.vehicle_vignette SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.vehicules_traites_echeances SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.infraction_files SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.sinistre_files SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.assurance_bareme SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.vehicle_assistance_categories SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.user_roles SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  UPDATE public.audit_logs SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
END $$;

-- 5. Rendre tenant_id obligatoire (NOT NULL)
ALTER TABLE public.vehicles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.clients ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.contracts ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.assistance ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.assurances ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.expenses ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.revenus ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.cheques ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.sinistres ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.infractions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.interventions ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vidanges ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vehicules_traite ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.contract_payments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.secondary_drivers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vehicle_affectations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vehicle_changes ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vehicle_insurance ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vehicle_technical_inspection ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vehicle_vignette ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vehicules_traites_echeances ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.infraction_files ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.sinistre_files ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.assurance_bareme ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.vehicle_assistance_categories ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN tenant_id SET NOT NULL;

-- 6. Modifier user_roles pour multi-tenant
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_tenant_role_unique 
UNIQUE(user_id, tenant_id, role);

-- Mettre à jour has_role pour considérer le tenant
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
    AND tenant_id = public.get_user_tenant_id(_user_id)
  )
$$;

-- 7. Créer tenant_settings (remplacer agence_settings)
CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) UNIQUE NOT NULL,
  nom TEXT,
  raison_sociale TEXT,
  adresse TEXT,
  telephone TEXT,
  email TEXT,
  ice TEXT,
  if_number TEXT,
  cnss TEXT,
  patente TEXT,
  rc TEXT,
  logo_url TEXT,
  signature_agence_url TEXT,
  taux_tva NUMERIC DEFAULT 20,
  alerte_cheque_jours INTEGER DEFAULT 7,
  alerte_visite_jours INTEGER DEFAULT 30,
  alerte_assurance_jours INTEGER DEFAULT 30,
  alerte_autorisation_jours INTEGER DEFAULT 30,
  masquer_logo BOOLEAN DEFAULT false,
  masquer_entete BOOLEAN DEFAULT false,
  masquer_pied_page BOOLEAN DEFAULT false,
  inclure_cgv BOOLEAN DEFAULT false,
  cgv_texte TEXT,
  cgv_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS update_tenant_settings_updated_at ON public.tenant_settings;
CREATE TRIGGER update_tenant_settings_updated_at 
  BEFORE UPDATE ON public.tenant_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Migrer les données d'agence_settings
DO $$
DECLARE
  default_tenant_id UUID;
BEGIN
  SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'default-agency';
  
  INSERT INTO public.tenant_settings (
    tenant_id, nom, raison_sociale, adresse, telephone, email,
    ice, if_number, cnss, patente, rc, logo_url, signature_agence_url,
    taux_tva, alerte_cheque_jours, alerte_visite_jours,
    alerte_assurance_jours, alerte_autorisation_jours,
    masquer_logo, masquer_entete, masquer_pied_page, inclure_cgv,
    cgv_texte, cgv_url
  )
  SELECT 
    default_tenant_id, nom, raison_sociale, adresse, telephone, email,
    ice, if_number, cnss, patente, rc, logo_url, signature_agence_url,
    taux_tva, alerte_cheque_jours, alerte_visite_jours,
    alerte_assurance_jours, alerte_autorisation_jours,
    masquer_logo, masquer_entete, masquer_pied_page, inclure_cgv,
    cgv_texte, cgv_url
  FROM public.agence_settings
  LIMIT 1
  ON CONFLICT (tenant_id) DO NOTHING;
END $$;

-- RLS sur tenant_settings
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant settings" ON public.tenant_settings;
CREATE POLICY "Users can view their tenant settings"
ON public.tenant_settings FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Admins can update their tenant settings" ON public.tenant_settings;
CREATE POLICY "Admins can update their tenant settings"
ON public.tenant_settings FOR UPDATE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

-- 8. Mettre à jour handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_tenant_id UUID;
BEGIN
  -- Créer le profil
  INSERT INTO public.profiles (id, email, nom, actif)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', NEW.email),
    true
  );
  
  -- Récupérer le tenant par défaut
  SELECT id INTO default_tenant_id
  FROM public.tenants
  WHERE is_active = true
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Lier au tenant par défaut
  IF default_tenant_id IS NOT NULL THEN
    INSERT INTO public.user_tenants (user_id, tenant_id, is_active)
    VALUES (NEW.id, default_tenant_id, true);
    
    -- Créer le rôle agent par défaut
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (NEW.id, default_tenant_id, 'agent');
  END IF;
  
  RETURN NEW;
END;
$$;