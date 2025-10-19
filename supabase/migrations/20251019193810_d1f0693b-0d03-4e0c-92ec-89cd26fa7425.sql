-- Corriger le trigger handle_new_user pour honorer skip_tenant_creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;