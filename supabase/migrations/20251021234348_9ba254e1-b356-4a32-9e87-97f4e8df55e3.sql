-- Mettre à jour la fonction pour créer des dépenses d'assurance avec le bon type
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
      mode_paiement,
      tenant_id
    ) VALUES (
      NEW.vehicle_id,
      NEW.date_paiement,
      NEW.montant,
      'Assurance véhicule - ' || NEW.assureur,
      'assurance',
      'Assurance',
      'paye',
      COALESCE(NEW.mode_paiement, 'espece'),
      NEW.tenant_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Mettre à jour la fonction pour créer des dépenses de visite technique avec le bon type
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
      mode_paiement,
      tenant_id
    ) VALUES (
      NEW.vehicle_id,
      NEW.date_paiement,
      NEW.montant,
      'Visite technique - ' || COALESCE(NEW.centre_controle, 'Centre de contrôle'),
      'visite_technique',
      'Visite technique',
      'paye',
      COALESCE(NEW.mode_paiement, 'espece'),
      NEW.tenant_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Mettre à jour la fonction pour créer des dépenses de vignette avec le bon type
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
      mode_paiement,
      tenant_id
    ) VALUES (
      NEW.vehicle_id,
      NEW.date_paiement,
      NEW.montant,
      'Vignette année ' || NEW.annee,
      'vignette',
      'Vignette',
      'paye',
      COALESCE(NEW.mode_paiement, 'espece'),
      NEW.tenant_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Mettre à jour les dépenses existantes pour corriger les types
UPDATE expenses 
SET type_depense = 'assurance'
WHERE type_depense = 'document' 
AND categorie = 'Assurance';

UPDATE expenses 
SET type_depense = 'vignette'
WHERE type_depense = 'document' 
AND categorie = 'Vignette';

UPDATE expenses 
SET type_depense = 'visite_technique'
WHERE type_depense = 'document' 
AND categorie = 'Visite technique';