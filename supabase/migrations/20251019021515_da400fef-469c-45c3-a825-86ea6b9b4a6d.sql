-- Créer l'utilisateur super_admin
DO $$
DECLARE
  new_user_id uuid;
  created_tenant_id uuid;
BEGIN
  -- Générer un UUID pour l'utilisateur
  new_user_id := gen_random_uuid();

  -- Insérer l'utilisateur dans auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    role,
    aud,
    confirmation_token,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'hammadianouar@gmail.com',
    crypt('RCSAPP2025!!', gen_salt('bf')),
    now(),
    '{"nom": "Super Admin"}'::jsonb,
    'authenticated',
    'authenticated',
    '',
    now(),
    now()
  );

  -- Le trigger handle_new_user a créé automatiquement:
  -- - un tenant
  -- - un profile
  -- - un user_tenant
  -- - un user_role admin
  -- On doit les nettoyer

  -- Récupérer le tenant créé
  SELECT tenant_id INTO created_tenant_id
  FROM user_tenants
  WHERE user_id = new_user_id;

  -- Supprimer le rôle admin automatique
  DELETE FROM user_roles
  WHERE user_id = new_user_id
  AND role = 'admin';

  -- Supprimer la liaison user_tenant
  DELETE FROM user_tenants
  WHERE user_id = new_user_id;

  -- Supprimer le tenant créé automatiquement
  IF created_tenant_id IS NOT NULL THEN
    DELETE FROM tenant_settings WHERE tenant_id = created_tenant_id;
    DELETE FROM tenants WHERE id = created_tenant_id;
  END IF;

  -- Ajouter le rôle super_admin (sans tenant_id)
  INSERT INTO user_roles (user_id, role, tenant_id)
  VALUES (new_user_id, 'super_admin', NULL);

  RAISE NOTICE 'Super admin créé avec succès - Email: hammadianouar@gmail.com, User ID: %', new_user_id;
END $$;