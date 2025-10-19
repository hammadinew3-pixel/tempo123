-- Fonction pour générer un numéro de contrat unique par tenant
CREATE OR REPLACE FUNCTION public.generate_contract_number(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
BEGIN
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Obtenir le prochain numéro pour ce tenant
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_contrat FROM 'CTR-\d+-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM contracts
  WHERE numero_contrat LIKE 'CTR-' || year_suffix || '-%'
  AND tenant_id = p_tenant_id;
  
  RETURN 'CTR-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Fonction pour générer un numéro de dossier d'assistance unique par tenant
CREATE OR REPLACE FUNCTION public.generate_assistance_number(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
BEGIN
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Obtenir le prochain numéro pour ce tenant
  SELECT COALESCE(MAX(CAST(SUBSTRING(num_dossier FROM 'ASS-\d+-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM assistance
  WHERE num_dossier LIKE 'ASS-' || year_suffix || '-%'
  AND tenant_id = p_tenant_id;
  
  RETURN 'ASS-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Trigger pour auto-générer le numéro de contrat
CREATE OR REPLACE FUNCTION public.set_contract_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero_contrat IS NULL OR NEW.numero_contrat = '' OR NEW.numero_contrat LIKE 'CTR-%' THEN
    NEW.numero_contrat := public.generate_contract_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger pour auto-générer le numéro de dossier d'assistance
CREATE OR REPLACE FUNCTION public.set_assistance_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.num_dossier IS NULL OR NEW.num_dossier = '' OR NEW.num_dossier LIKE 'ASS-%' THEN
    NEW.num_dossier := public.generate_assistance_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Créer les triggers
DROP TRIGGER IF EXISTS trigger_set_contract_number ON public.contracts;
CREATE TRIGGER trigger_set_contract_number
  BEFORE INSERT ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contract_number();

DROP TRIGGER IF EXISTS trigger_set_assistance_number ON public.assistance;
CREATE TRIGGER trigger_set_assistance_number
  BEFORE INSERT ON public.assistance
  FOR EACH ROW
  EXECUTE FUNCTION public.set_assistance_number();