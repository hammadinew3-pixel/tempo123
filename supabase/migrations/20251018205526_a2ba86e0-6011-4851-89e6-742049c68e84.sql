-- Fonction pour créer une dépense liée à une assurance
CREATE OR REPLACE FUNCTION public.create_expense_for_insurance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Créer une dépense si un montant est spécifié
  IF NEW.montant IS NOT NULL AND NEW.montant > 0 THEN
    INSERT INTO expenses (
      vehicle_id,
      date_depense,
      montant,
      description,
      type_depense,
      categorie,
      statut,
      mode_paiement
    ) VALUES (
      NEW.vehicle_id,
      NEW.date_paiement,
      NEW.montant,
      'Assurance véhicule - ' || NEW.assureur,
      'document',
      'Assurance',
      'paye',
      COALESCE(NEW.mode_paiement, 'espece')
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fonction pour créer une dépense liée à une visite technique
CREATE OR REPLACE FUNCTION public.create_expense_for_technical_inspection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Créer une dépense si un montant est spécifié
  IF NEW.montant IS NOT NULL AND NEW.montant > 0 THEN
    INSERT INTO expenses (
      vehicle_id,
      date_depense,
      montant,
      description,
      type_depense,
      categorie,
      statut,
      mode_paiement
    ) VALUES (
      NEW.vehicle_id,
      NEW.date_paiement,
      NEW.montant,
      'Visite technique - ' || COALESCE(NEW.centre_controle, 'Centre de contrôle'),
      'document',
      'Visite technique',
      'paye',
      COALESCE(NEW.mode_paiement, 'espece')
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fonction pour créer une dépense liée à une vignette
CREATE OR REPLACE FUNCTION public.create_expense_for_vignette()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Créer une dépense si un montant est spécifié
  IF NEW.montant IS NOT NULL AND NEW.montant > 0 THEN
    INSERT INTO expenses (
      vehicle_id,
      date_depense,
      montant,
      description,
      type_depense,
      categorie,
      statut,
      mode_paiement
    ) VALUES (
      NEW.vehicle_id,
      NEW.date_paiement,
      NEW.montant,
      'Vignette année ' || NEW.annee,
      'document',
      'Vignette',
      'paye',
      COALESCE(NEW.mode_paiement, 'espece')
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Trigger pour les assurances
DROP TRIGGER IF EXISTS trigger_create_expense_for_insurance ON vehicle_insurance;
CREATE TRIGGER trigger_create_expense_for_insurance
  AFTER INSERT ON vehicle_insurance
  FOR EACH ROW
  EXECUTE FUNCTION create_expense_for_insurance();

-- Trigger pour les visites techniques
DROP TRIGGER IF EXISTS trigger_create_expense_for_technical_inspection ON vehicle_technical_inspection;
CREATE TRIGGER trigger_create_expense_for_technical_inspection
  AFTER INSERT ON vehicle_technical_inspection
  FOR EACH ROW
  EXECUTE FUNCTION create_expense_for_technical_inspection();

-- Trigger pour les vignettes
DROP TRIGGER IF EXISTS trigger_create_expense_for_vignette ON vehicle_vignette;
CREATE TRIGGER trigger_create_expense_for_vignette
  AFTER INSERT ON vehicle_vignette
  FOR EACH ROW
  EXECUTE FUNCTION create_expense_for_vignette();