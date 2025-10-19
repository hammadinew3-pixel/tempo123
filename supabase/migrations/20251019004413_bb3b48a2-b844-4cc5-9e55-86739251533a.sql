-- Modifier le trigger handle_new_user pour créer un tenant par utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_tenant_id UUID;
  tenant_name TEXT;
BEGIN
  -- Générer un nom de tenant unique basé sur l'email
  tenant_name := COALESCE(
    NEW.raw_user_meta_data->>'nom',
    SPLIT_PART(NEW.email, '@', 1)
  ) || '''s Agency';
  
  -- Créer le profil
  INSERT INTO public.profiles (id, email, nom, actif)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', NEW.email),
    true
  );
  
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
  
  -- Créer les settings par défaut pour ce tenant
  INSERT INTO public.tenant_settings (tenant_id)
  VALUES (new_tenant_id);
  
  RETURN NEW;
END;
$function$;

-- Ajouter une policy pour que seuls les admins puissent voir les user_roles
CREATE POLICY "Admins can view all roles in their tenant"
ON public.user_roles
FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- Ajouter une policy pour que seuls les admins puissent créer des rôles
CREATE POLICY "Admins can create roles in their tenant"
ON public.user_roles
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
  AND role = 'agent'
);

-- Permettre aux admins de voir tous les profils de leur tenant
CREATE POLICY "Admins can view profiles in their tenant"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  AND id IN (
    SELECT user_id FROM user_tenants
    WHERE tenant_id = get_user_tenant_id(auth.uid())
  )
);

-- Permettre aux admins de mettre à jour les profils de leur tenant
CREATE POLICY "Admins can update profiles in their tenant"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin')
  AND id IN (
    SELECT user_id FROM user_tenants
    WHERE tenant_id = get_user_tenant_id(auth.uid())
  )
);

-- Permettre aux admins de voir les user_tenants de leur tenant
CREATE POLICY "Admins can view user_tenants in their tenant"
ON public.user_tenants
FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- Permettre aux admins de créer des user_tenants dans leur tenant
CREATE POLICY "Admins can create user_tenants in their tenant"
ON public.user_tenants
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);