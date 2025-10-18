-- Fonction pour enregistrer les modifications dans audit_logs
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  changed_fields text[];
  user_email text;
BEGIN
  -- Récupérer l'email de l'utilisateur depuis auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Préparer les données selon le type d'action
  IF (TG_OP = 'DELETE') THEN
    old_data := to_jsonb(OLD);
    new_data := NULL;
    changed_fields := NULL;
  ELSIF (TG_OP = 'UPDATE') THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    -- Identifier les champs modifiés
    SELECT ARRAY_AGG(key)
    INTO changed_fields
    FROM jsonb_each(new_data)
    WHERE new_data->key IS DISTINCT FROM old_data->key;
  ELSIF (TG_OP = 'INSERT') THEN
    old_data := NULL;
    new_data := to_jsonb(NEW);
    changed_fields := NULL;
  END IF;

  -- Insérer l'événement d'audit
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_fields,
    user_id,
    user_email
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    old_data,
    new_data,
    changed_fields,
    auth.uid(),
    user_email
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Créer les triggers pour les tables importantes

-- Clients
DROP TRIGGER IF EXISTS audit_clients ON clients;
CREATE TRIGGER audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Véhicules
DROP TRIGGER IF EXISTS audit_vehicles ON vehicles;
CREATE TRIGGER audit_vehicles
  AFTER INSERT OR UPDATE OR DELETE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Contrats
DROP TRIGGER IF EXISTS audit_contracts ON contracts;
CREATE TRIGGER audit_contracts
  AFTER INSERT OR UPDATE OR DELETE ON contracts
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Paiements de contrats
DROP TRIGGER IF EXISTS audit_contract_payments ON contract_payments;
CREATE TRIGGER audit_contract_payments
  AFTER INSERT OR UPDATE OR DELETE ON contract_payments
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Assistance
DROP TRIGGER IF EXISTS audit_assistance ON assistance;
CREATE TRIGGER audit_assistance
  AFTER INSERT OR UPDATE OR DELETE ON assistance
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Infractions
DROP TRIGGER IF EXISTS audit_infractions ON infractions;
CREATE TRIGGER audit_infractions
  AFTER INSERT OR UPDATE OR DELETE ON infractions
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Sinistres
DROP TRIGGER IF EXISTS audit_sinistres ON sinistres;
CREATE TRIGGER audit_sinistres
  AFTER INSERT OR UPDATE OR DELETE ON sinistres
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Dépenses
DROP TRIGGER IF EXISTS audit_expenses ON expenses;
CREATE TRIGGER audit_expenses
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Revenus
DROP TRIGGER IF EXISTS audit_revenus ON revenus;
CREATE TRIGGER audit_revenus
  AFTER INSERT OR UPDATE OR DELETE ON revenus
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Interventions maintenance
DROP TRIGGER IF EXISTS audit_interventions ON interventions;
CREATE TRIGGER audit_interventions
  AFTER INSERT OR UPDATE OR DELETE ON interventions
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Assurances véhicules
DROP TRIGGER IF EXISTS audit_vehicle_insurance ON vehicle_insurance;
CREATE TRIGGER audit_vehicle_insurance
  AFTER INSERT OR UPDATE OR DELETE ON vehicle_insurance
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Visites techniques
DROP TRIGGER IF EXISTS audit_vehicle_technical_inspection ON vehicle_technical_inspection;
CREATE TRIGGER audit_vehicle_technical_inspection
  AFTER INSERT OR UPDATE OR DELETE ON vehicle_technical_inspection
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Vignettes
DROP TRIGGER IF EXISTS audit_vehicle_vignette ON vehicle_vignette;
CREATE TRIGGER audit_vehicle_vignette
  AFTER INSERT OR UPDATE OR DELETE ON vehicle_vignette
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();