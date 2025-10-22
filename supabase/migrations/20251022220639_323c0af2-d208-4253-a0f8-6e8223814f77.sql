-- Correction du trigger pour la création de dépense lors de sous-location
-- Le problème: il manquait la valeur pour contract_id dans le INSERT

CREATE OR REPLACE FUNCTION public.create_sous_location_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  vehicle_type text;
BEGIN
  -- Récupérer le type du véhicule
  SELECT type_vehicule INTO vehicle_type FROM vehicles WHERE id = NEW.vehicle_id;

  -- Si c'est un véhicule en sous-location, créer une dépense
  IF vehicle_type = 'sous_location' AND NEW.total_amount IS NOT NULL THEN
    INSERT INTO expenses (
      tenant_id,
      categorie,
      type_depense,
      description,
      montant,
      date_depense,
      statut,
      contract_id
    )
    VALUES (
      NEW.tenant_id,
      'Sous-location',
      'sous_location',
      'Paiement sous-location - Contrat ' || NEW.numero_contrat,
      NEW.total_amount,
      NEW.date_debut,
      'paye',
      NEW.id  -- <- Valeur manquante corrigée
    );
  END IF;

  RETURN NEW;
END;
$function$;