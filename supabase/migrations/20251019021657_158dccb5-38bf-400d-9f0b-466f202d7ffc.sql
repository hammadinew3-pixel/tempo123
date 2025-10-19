-- Modifier get_user_tenant_id pour gérer les super_admins
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Si l'utilisateur est super_admin, retourner NULL (pas de tenant)
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = _user_id 
      AND role = 'super_admin' 
      AND tenant_id IS NULL
    ) THEN NULL
    ELSE (
      SELECT tenant_id 
      FROM public.user_tenants 
      WHERE user_id = _user_id 
      AND is_active = true
      LIMIT 1
    )
  END
$$;

-- Modifier le trigger handle_new_user pour ne pas créer de tenant pour super_admin
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
BEGIN
  -- Créer le profil pour tous les utilisateurs
  INSERT INTO public.profiles (id, email, nom, actif)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', NEW.email),
    true
  );
  
  -- Ne créer un tenant QUE si ce n'est PAS un super_admin
  -- (On détecte un super_admin par l'absence de metadata 'create_tenant')
  IF COALESCE(NEW.raw_user_meta_data->>'skip_tenant_creation', 'false') = 'false' THEN
    -- Générer un nom de tenant unique basé sur l'email
    tenant_name := COALESCE(
      NEW.raw_user_meta_data->>'nom',
      SPLIT_PART(NEW.email, '@', 1)
    ) || '''s Agency';
    
    -- Créer un nouveau tenant pour cet utilisateur
    INSERT INTO public.tenants (name, slug, is_active)
    VALUES (
      tenant_name,
      'tenant-' || LOWER(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', '-')) || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
      true
    )
    RETURNING id INTO new_tenant_id;
    
    -- Lier l'utilisateur à son nouveau tenant
    INSERT INTO public.user_tenants (user_id, tenant_id, is_active)
    VALUES (NEW.id, new_tenant_id, true);
    
    -- Créer le rôle admin pour ce tenant
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (NEW.id, new_tenant_id, 'admin');
    
    -- Récupérer les CGV du premier tenant (tenant le plus ancien)
    SELECT cgv_texte, inclure_cgv
    INTO default_cgv_texte, default_inclure_cgv
    FROM public.tenant_settings
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Créer les settings par défaut pour ce tenant avec les CGV standard
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