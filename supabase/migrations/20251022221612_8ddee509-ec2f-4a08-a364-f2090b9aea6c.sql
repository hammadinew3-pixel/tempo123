-- Ajouter le champ tarif_sous_location pour stocker le coût fournisseur
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS tarif_sous_location numeric(10,2);

COMMENT ON COLUMN vehicles.tarif_sous_location IS 'Coût journalier fournisseur pour les véhicules en sous-location (non visible dans les contrats clients)';

-- Corriger la fonction pour créer automatiquement une dépense basée sur le coût fournisseur
CREATE OR REPLACE FUNCTION public.create_sous_location_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  vehicle_type text;
  cout_journalier numeric;
  duree_contrat integer;
BEGIN
  -- Récupérer le type du véhicule et son tarif de sous-location
  SELECT type_vehicule, tarif_sous_location
  INTO vehicle_type, cout_journalier
  FROM vehicles WHERE id = NEW.vehicle_id;

  -- Si c'est un véhicule en sous-location avec un coût défini, créer une dépense
  IF vehicle_type = 'sous_location' AND cout_journalier IS NOT NULL AND cout_journalier > 0 THEN
    -- Calculer la durée du contrat
    duree_contrat := COALESCE(NEW.duration, 
      FLOOR(EXTRACT(EPOCH FROM (NEW.date_fin::timestamp - NEW.date_debut::timestamp)) / 86400)
    );
    
    INSERT INTO expenses (
      tenant_id,
      categorie,
      type_depense,
      description,
      montant,
      date_depense,
      statut,
      contract_id,
      vehicle_id
    )
    VALUES (
      NEW.tenant_id,
      'Sous-location',
      'sous_location',
      'Coût sous-location - Contrat ' || NEW.numero_contrat || ' (' || duree_contrat || ' jours)',
      cout_journalier * duree_contrat,
      NEW.date_debut,
      'paye',
      NEW.id,
      NEW.vehicle_id
    );
  END IF;

  RETURN NEW;
END;
$function$;