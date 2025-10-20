-- 1. Ajouter colonne status à tenants
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_validation';

-- Mettre à jour les tenants existants actifs
UPDATE tenants 
SET status = 'active' 
WHERE is_active = true;

-- 2. Ajouter colonnes de paiement à subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'awaiting_payment';

-- Mettre à jour les subscriptions existantes actives
UPDATE subscriptions 
SET status = 'active' 
WHERE is_active = true;

-- 3. Créer la table settings_bancaires
CREATE TABLE IF NOT EXISTS settings_bancaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_banque TEXT NOT NULL,
  rib TEXT NOT NULL,
  swift TEXT,
  titulaire TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les coordonnées bancaires par défaut
INSERT INTO settings_bancaires (nom_banque, rib, swift, titulaire)
VALUES (
  'Banque Populaire',
  '000 000 000000000000 00',
  'BCMAMAMCXXX',
  'CRSApp SARL'
);

-- 4. RLS policies pour settings_bancaires
ALTER TABLE settings_bancaires ENABLE ROW LEVEL SECURITY;

-- Super Admin peut tout faire
CREATE POLICY "Super admins can manage bank settings"
  ON settings_bancaires
  FOR ALL
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Les utilisateurs authentifiés peuvent voir les coordonnées
CREATE POLICY "Authenticated users can view bank settings"
  ON settings_bancaires
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 5. Créer bucket pour les justificatifs de paiement
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies pour le bucket payment-proofs
CREATE POLICY "Users can upload their payment proof"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-proofs' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view their payment proof"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Super admins can view all payment proofs"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND is_super_admin(auth.uid())
  );

-- 6. Modifier la fonction handle_new_user pour créer des tenants en pending_validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_tenant_id UUID;
  tenant_name TEXT;
  default_cgv_texte TEXT;
  default_inclure_cgv BOOLEAN;
  should_skip_tenant BOOLEAN;
BEGIN
  -- Créer le profil pour tous les utilisateurs
  INSERT INTO public.profiles (id, email, nom, actif)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', NEW.email),
    true
  );
  
  -- Vérifier si on doit sauter la création du tenant
  should_skip_tenant := COALESCE(NEW.raw_user_meta_data->>'skip_tenant_creation', 'false') = 'true';
  
  -- Ne créer un tenant QUE si skip_tenant_creation n'est pas 'true'
  IF NOT should_skip_tenant THEN
    -- Générer un nom de tenant basé sur agency_name ou email
    tenant_name := COALESCE(
      NEW.raw_user_meta_data->>'agency_name',
      SPLIT_PART(NEW.email, '@', 1)
    ) || '''s Agency';
    
    -- Créer un nouveau tenant avec status pending_validation et inactif
    INSERT INTO public.tenants (name, slug, is_active, status)
    VALUES (
      tenant_name,
      'tenant-' || LOWER(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', '-')) || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
      false,
      'pending_validation'
    )
    RETURNING id INTO new_tenant_id;
    
    -- Lier l'utilisateur à son nouveau tenant
    INSERT INTO public.user_tenants (user_id, tenant_id, is_active)
    VALUES (NEW.id, new_tenant_id, true);
    
    -- Créer le rôle admin pour ce tenant
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (NEW.id, new_tenant_id, 'admin');
    
    -- Récupérer les CGV du premier tenant
    SELECT cgv_texte, inclure_cgv
    INTO default_cgv_texte, default_inclure_cgv
    FROM public.tenant_settings
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Créer les settings par défaut pour ce tenant
    INSERT INTO public.tenant_settings (
      tenant_id,
      cgv_texte,
      inclure_cgv
    )
    VALUES (
      new_tenant_id,
      default_cgv_texte,
      COALESCE(default_inclure_cgv, false)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger pour updated_at sur settings_bancaires
CREATE TRIGGER update_settings_bancaires_updated_at
BEFORE UPDATE ON settings_bancaires
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();