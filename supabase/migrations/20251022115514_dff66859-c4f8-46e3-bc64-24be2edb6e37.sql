-- 1️⃣ Modifier le trigger handle_new_user pour sauvegarder raison_sociale et ice
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_tenant_id UUID;
  tenant_name TEXT;
  tenant_ice TEXT;
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
    -- Extraire agency_name et ice des métadonnées
    tenant_name := COALESCE(
      NEW.raw_user_meta_data->>'agency_name',
      SPLIT_PART(NEW.email, '@', 1)
    ) || '''s Agency';
    
    tenant_ice := NEW.raw_user_meta_data->>'ice';
    
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
    
    -- ✅ NOUVEAU : Créer les settings par défaut avec raison_sociale et ice
    INSERT INTO public.tenant_settings (
      tenant_id,
      raison_sociale,
      ice,
      nom,
      cgv_texte,
      inclure_cgv
    )
    VALUES (
      new_tenant_id,
      COALESCE(NEW.raw_user_meta_data->>'agency_name', tenant_name),
      tenant_ice,
      COALESCE(NEW.raw_user_meta_data->>'agency_name', tenant_name),
      default_cgv_texte,
      COALESCE(default_inclure_cgv, false)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2️⃣ Créer une fonction pour empêcher la modification de raison_sociale et ice
CREATE OR REPLACE FUNCTION public.prevent_readonly_fields_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Empêcher la modification de raison_sociale si elle existe déjà
  IF OLD.raison_sociale IS NOT NULL AND OLD.raison_sociale != '' 
     AND NEW.raison_sociale IS DISTINCT FROM OLD.raison_sociale THEN
    RAISE EXCEPTION 'La raison sociale ne peut pas être modifiée après création';
  END IF;
  
  -- Empêcher la modification de ice s'il existe déjà
  IF OLD.ice IS NOT NULL AND OLD.ice != '' 
     AND NEW.ice IS DISTINCT FROM OLD.ice THEN
    RAISE EXCEPTION 'L''ICE ne peut pas être modifié après création';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3️⃣ Créer le trigger pour appliquer la protection
DROP TRIGGER IF EXISTS prevent_tenant_settings_readonly_update ON tenant_settings;
CREATE TRIGGER prevent_tenant_settings_readonly_update
BEFORE UPDATE ON tenant_settings
FOR EACH ROW
EXECUTE FUNCTION prevent_readonly_fields_update();

-- 4️⃣ Migration pour les tenants existants : copier name vers raison_sociale/nom si vides
UPDATE tenant_settings ts
SET 
  raison_sociale = COALESCE(NULLIF(ts.raison_sociale, ''), t.name),
  nom = COALESCE(NULLIF(ts.nom, ''), t.name)
FROM tenants t
WHERE ts.tenant_id = t.id
  AND (ts.raison_sociale IS NULL OR ts.raison_sociale = '' OR ts.nom IS NULL OR ts.nom = '');