-- Fonction de validation pour les mises à jour de véhicules par les agents
CREATE OR REPLACE FUNCTION public.validate_agent_vehicle_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Récupérer le rôle de l'utilisateur
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  -- Si c'est un admin, autoriser toutes les modifications
  IF user_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Si c'est un agent, vérifier que seuls les champs autorisés sont modifiés
  IF user_role = 'agent' THEN
    -- Vérifier que les champs non autorisés n'ont pas changé
    IF OLD.marque IS DISTINCT FROM NEW.marque THEN
      RAISE EXCEPTION 'Les agents ne peuvent pas modifier le champ marque';
    END IF;
    
    IF OLD.modele IS DISTINCT FROM NEW.modele THEN
      RAISE EXCEPTION 'Les agents ne peuvent pas modifier le champ modèle';
    END IF;
    
    IF OLD.immatriculation IS DISTINCT FROM NEW.immatriculation THEN
      RAISE EXCEPTION 'Les agents ne peuvent pas modifier l''immatriculation';
    END IF;
    
    IF OLD.annee IS DISTINCT FROM NEW.annee THEN
      RAISE EXCEPTION 'Les agents ne peuvent pas modifier l''année';
    END IF;
    
    IF OLD.categorie IS DISTINCT FROM NEW.categorie THEN
      RAISE EXCEPTION 'Les agents ne peuvent pas modifier la catégorie';
    END IF;
    
    IF OLD.tarif_journalier IS DISTINCT FROM NEW.tarif_journalier THEN
      RAISE EXCEPTION 'Les agents ne peuvent pas modifier le tarif journalier';
    END IF;
    
    IF OLD.valeur_achat IS DISTINCT FROM NEW.valeur_achat THEN
      RAISE EXCEPTION 'Les agents ne peuvent pas modifier la valeur d''achat';
    END IF;
    
    IF OLD.en_service IS DISTINCT FROM NEW.en_service THEN
      RAISE EXCEPTION 'Les agents ne peuvent pas modifier le statut en service';
    END IF;
    
    IF OLD.sous_location IS DISTINCT FROM NEW.sous_location THEN
      RAISE EXCEPTION 'Les agents ne peuvent pas modifier le statut sous-location';
    END IF;
    
    -- Les agents peuvent modifier: kilometrage, statut, photo_url, updated_at
    RETURN NEW;
  END IF;

  -- Pour les autres rôles (comptable), bloquer toute modification
  RAISE EXCEPTION 'Vous n''avez pas la permission de modifier les véhicules';
END;
$$;

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS validate_agent_vehicle_update_trigger ON public.vehicles;

-- Créer le trigger pour valider les mises à jour
CREATE TRIGGER validate_agent_vehicle_update_trigger
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.validate_agent_vehicle_update();

-- Mettre à jour les politiques RLS
DROP POLICY IF EXISTS "Admins can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Agents can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can update all vehicle fields" ON public.vehicles;
DROP POLICY IF EXISTS "Agents can update limited vehicle fields" ON public.vehicles;

-- Une seule politique simple pour les mises à jour
-- Le trigger se chargera de la validation détaillée
CREATE POLICY "Users can update vehicles based on role"
ON public.vehicles
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'agent'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'agent'::app_role)
);