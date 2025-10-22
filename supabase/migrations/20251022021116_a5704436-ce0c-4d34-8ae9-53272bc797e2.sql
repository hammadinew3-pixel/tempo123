-- Modifier le trigger d'audit pour gérer les suppressions en cascade
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  old_data jsonb;
  new_data jsonb;
  changed_fields text[];
  user_email text;
  tenant_id_value uuid;
BEGIN
  -- Récupérer l'email de l'utilisateur depuis auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Récupérer le tenant_id depuis l'enregistrement (NEW ou OLD)
  IF (TG_OP = 'DELETE') THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
    changed_fields := NULL;
    tenant_id_value := OLD.tenant_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    -- Identifier les champs modifiés
    SELECT ARRAY_AGG(key)
    INTO changed_fields
    FROM jsonb_each(new_data)
    WHERE new_data->key IS DISTINCT FROM old_data->key;
    tenant_id_value := NEW.tenant_id;
  ELSIF (TG_OP = 'INSERT') THEN
    old_data := NULL;
    new_data := to_jsonb(NEW);
    changed_fields := NULL;
    tenant_id_value := NEW.tenant_id;
  END IF;

  -- Insérer l'événement d'audit avec gestion des erreurs
  BEGIN
    INSERT INTO public.audit_logs (
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      changed_fields,
      user_id,
      user_email,
      tenant_id
    ) VALUES (
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      TG_OP,
      old_data,
      new_data,
      changed_fields,
      auth.uid(),
      user_email,
      tenant_id_value
    );
  EXCEPTION
    WHEN foreign_key_violation THEN
      -- Ignorer silencieusement les violations de clé étrangère
      -- (cela arrive lors de suppressions en cascade de tenants)
      NULL;
  END;

  RETURN COALESCE(NEW, OLD);
END;
$function$;