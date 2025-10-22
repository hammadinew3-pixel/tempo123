-- Ajouter le type de véhicule
ALTER TABLE vehicles
ADD COLUMN type_vehicule text DEFAULT 'proprietaire' CHECK (type_vehicule IN ('proprietaire', 'sous_location'));

-- Fonction pour créer automatiquement une dépense de sous-location
CREATE OR REPLACE FUNCTION create_sous_location_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
      'paye'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger pour créer automatiquement la dépense
CREATE TRIGGER auto_expense_sous_location
AFTER INSERT ON contracts
FOR EACH ROW
EXECUTE FUNCTION create_sous_location_expense();