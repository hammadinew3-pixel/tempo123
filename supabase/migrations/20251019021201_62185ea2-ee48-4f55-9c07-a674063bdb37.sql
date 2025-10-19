-- Autoriser tenant_id NULL pour les super_admins
ALTER TABLE public.user_roles 
  ALTER COLUMN tenant_id DROP NOT NULL;

-- Ajouter contrainte : tenant_id obligatoire sauf pour super_admin
ALTER TABLE public.user_roles
  ADD CONSTRAINT tenant_id_required_except_super_admin
  CHECK (
    (role = 'super_admin' AND tenant_id IS NULL) OR
    (role != 'super_admin' AND tenant_id IS NOT NULL)
  );

-- Créer fonction is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = 'super_admin'
    AND tenant_id IS NULL
  )
$$;

-- Modifier fonction has_role pour supporter super_admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
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
    AND (
      -- Super admin global
      (role = 'super_admin' AND tenant_id IS NULL) OR
      -- Role tenant-scoped
      (role != 'super_admin' AND tenant_id = get_user_tenant_id(_user_id))
    )
  )
$$;

-- Permettre aux super_admins de voir tous les tenants
CREATE POLICY "Super admins can view all tenants"
ON public.tenants FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Permettre aux super_admins de mettre à jour les tenants
CREATE POLICY "Super admins can update all tenants"
ON public.tenants FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Permettre aux super_admins de voir tous les user_tenants
CREATE POLICY "Super admins can view all user_tenants"
ON public.user_tenants FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Permettre aux super_admins de voir tous les profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Commentaire sur la table user_roles
COMMENT ON TABLE public.user_roles IS 
'Rôles utilisateurs. Un super_admin a tenant_id NULL et voit tous les tenants. Les autres rôles (admin, agent) sont limités à leur tenant.';

-- Ajouter RLS policy pour super_admin sur user_roles
CREATE POLICY "Super admins can view all user_roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert user_roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update user_roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete user_roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));