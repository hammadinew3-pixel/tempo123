-- Rendre les références d'infractions et sinistres tenant-aware

-- 1. Ajouter contraintes uniques sur (tenant_id, reference)
ALTER TABLE public.infractions
DROP CONSTRAINT IF EXISTS infractions_tenant_reference_key;

ALTER TABLE public.infractions
ADD CONSTRAINT infractions_tenant_reference_key 
UNIQUE (tenant_id, reference);

ALTER TABLE public.sinistres
DROP CONSTRAINT IF EXISTS sinistres_tenant_reference_key;

ALTER TABLE public.sinistres
ADD CONSTRAINT sinistres_tenant_reference_key 
UNIQUE (tenant_id, reference);

-- 2. Créer fonction tenant-aware pour infractions
CREATE OR REPLACE FUNCTION public.generate_infraction_reference(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
  new_reference TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  LOOP
    -- Calculer le prochain numéro pour ce tenant et cette année
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'INF-\d+-(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM infractions
    WHERE reference LIKE 'INF-' || year_suffix || '-%'
    AND tenant_id = p_tenant_id;
    
    new_reference := 'INF-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
    
    -- Vérifier si la référence existe déjà pour ce tenant
    IF NOT EXISTS (
      SELECT 1 FROM infractions 
      WHERE reference = new_reference 
      AND tenant_id = p_tenant_id
    ) THEN
      RETURN new_reference;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique infraction reference after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$function$;

-- 3. Créer fonction tenant-aware pour sinistres
CREATE OR REPLACE FUNCTION public.generate_sinistre_reference(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
  new_reference TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  LOOP
    -- Calculer le prochain numéro pour ce tenant et cette année
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM 'SIN-\d+-(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM sinistres
    WHERE reference LIKE 'SIN-' || year_suffix || '-%'
    AND tenant_id = p_tenant_id;
    
    new_reference := 'SIN-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
    
    -- Vérifier si la référence existe déjà pour ce tenant
    IF NOT EXISTS (
      SELECT 1 FROM sinistres 
      WHERE reference = new_reference 
      AND tenant_id = p_tenant_id
    ) THEN
      RETURN new_reference;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique sinistre reference after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$function$;

-- 4. Créer trigger pour auto-génération des références d'infractions
CREATE OR REPLACE FUNCTION public.set_infraction_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := public.generate_infraction_reference(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_infraction_reference_trigger ON public.infractions;

CREATE TRIGGER set_infraction_reference_trigger
BEFORE INSERT ON public.infractions
FOR EACH ROW
EXECUTE FUNCTION public.set_infraction_reference();

-- 5. Créer trigger pour auto-génération des références de sinistres
CREATE OR REPLACE FUNCTION public.set_sinistre_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := public.generate_sinistre_reference(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_sinistre_reference_trigger ON public.sinistres;

CREATE TRIGGER set_sinistre_reference_trigger
BEFORE INSERT ON public.sinistres
FOR EACH ROW
EXECUTE FUNCTION public.set_sinistre_reference();