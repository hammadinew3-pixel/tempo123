-- Corriger la fonction generate_contract_number pour éviter l'erreur FOR UPDATE avec MAX()
CREATE OR REPLACE FUNCTION public.generate_contract_number(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
  new_number TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  LOOP
    -- Obtenir le prochain numéro pour ce tenant sans FOR UPDATE
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_contrat FROM 'CTR-\d+-(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM contracts
    WHERE numero_contrat LIKE 'CTR-' || year_suffix || '-%'
    AND tenant_id = p_tenant_id;
    
    new_number := 'CTR-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
    
    -- Vérifier si le numéro existe déjà
    IF NOT EXISTS (
      SELECT 1 FROM contracts 
      WHERE numero_contrat = new_number 
      AND tenant_id = p_tenant_id
    ) THEN
      RETURN new_number;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique contract number after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$function$;