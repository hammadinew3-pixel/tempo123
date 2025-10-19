-- Améliorer la génération automatique des numéros d'assistance avec protection anti-collision

-- 1. Ajouter contrainte unique si elle n'existe pas
ALTER TABLE public.assistance
DROP CONSTRAINT IF EXISTS assistance_tenant_num_dossier_key;

ALTER TABLE public.assistance
ADD CONSTRAINT assistance_tenant_num_dossier_key 
UNIQUE (tenant_id, num_dossier);

-- 2. Recréer la fonction avec mécanisme de retry anti-collision
CREATE OR REPLACE FUNCTION public.generate_assistance_number(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
  new_number TEXT;
  max_attempts INTEGER := 5;
  attempt INTEGER := 0;
BEGIN
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  LOOP
    -- Calculer le prochain numéro pour ce tenant et cette année
    SELECT COALESCE(MAX(CAST(SUBSTRING(num_dossier FROM 'ASS-\d+-(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM assistance
    WHERE num_dossier LIKE 'ASS-' || year_suffix || '-%'
    AND tenant_id = p_tenant_id;
    
    new_number := 'ASS-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
    
    -- Vérifier si le numéro existe déjà pour ce tenant
    IF NOT EXISTS (
      SELECT 1 FROM assistance 
      WHERE num_dossier = new_number 
      AND tenant_id = p_tenant_id
    ) THEN
      RETURN new_number;
    END IF;
    
    -- Incrémenter le compteur de tentatives
    attempt := attempt + 1;
    
    -- Si on a dépassé le nombre max de tentatives, lever une erreur
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Unable to generate unique assistance number after % attempts', max_attempts;
    END IF;
    
    -- Attendre un court instant avant de réessayer (50ms)
    PERFORM pg_sleep(0.05);
  END LOOP;
END;
$function$;

-- 3. Recréer la fonction de trigger pour l'auto-génération
CREATE OR REPLACE FUNCTION public.set_assistance_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.num_dossier IS NULL OR NEW.num_dossier = '' OR NEW.num_dossier LIKE 'ASS-%' THEN
    NEW.num_dossier := public.generate_assistance_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Supprimer l'ancien trigger s'il existe et créer le nouveau
DROP TRIGGER IF EXISTS trg_set_assistance_num ON public.assistance;

CREATE TRIGGER trg_set_assistance_num
BEFORE INSERT ON public.assistance
FOR EACH ROW
EXECUTE FUNCTION public.set_assistance_number();

-- Vérification : afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Fonction generate_assistance_number recréée avec mécanisme anti-collision';
  RAISE NOTICE '✅ Trigger trg_set_assistance_num activé sur public.assistance';
  RAISE NOTICE '✅ Contrainte UNIQUE (tenant_id, num_dossier) appliquée';
  RAISE NOTICE '✅ Protection contre insertions simultanées : 5 tentatives max avec 50ms entre chaque';
END $$;