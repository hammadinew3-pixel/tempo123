-- Update RLS policies for agent access

-- Clients: agents can read, insert, update (but not delete)
DROP POLICY IF EXISTS "Agents can view clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can manage clients" ON public.clients;

CREATE POLICY "Admins can manage clients"
ON public.clients
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view clients"
ON public.clients
FOR SELECT
USING (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'comptable'::app_role));

CREATE POLICY "Agents can insert clients"
ON public.clients
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can update clients"
ON public.clients
FOR UPDATE
USING (has_role(auth.uid(), 'agent'::app_role));

-- Contracts: agents can read, insert, update (but not delete)
DROP POLICY IF EXISTS "Agents can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admins can manage contracts" ON public.contracts;

CREATE POLICY "Admins can manage contracts"
ON public.contracts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view contracts"
ON public.contracts
FOR SELECT
USING (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'comptable'::app_role));

CREATE POLICY "Agents can insert contracts"
ON public.contracts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can update contracts"
ON public.contracts
FOR UPDATE
USING (has_role(auth.uid(), 'agent'::app_role));

-- Assistance: agents can read, insert, update (but not delete)
DROP POLICY IF EXISTS "Agents can view assistance" ON public.assistance;
DROP POLICY IF EXISTS "Admins can manage assistance" ON public.assistance;
DROP POLICY IF EXISTS "Admins have full access to assistance" ON public.assistance;

CREATE POLICY "Admins can manage assistance"
ON public.assistance
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view assistance"
ON public.assistance
FOR SELECT
USING (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can insert assistance"
ON public.assistance
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can update assistance"
ON public.assistance
FOR UPDATE
USING (has_role(auth.uid(), 'agent'::app_role));

-- Sinistres: agents can read, insert, update (but not delete)
DROP POLICY IF EXISTS "Agents can view sinistres" ON public.sinistres;
DROP POLICY IF EXISTS "Admins can manage sinistres" ON public.sinistres;
DROP POLICY IF EXISTS "Admins have full access to sinistres" ON public.sinistres;

CREATE POLICY "Admins can manage sinistres"
ON public.sinistres
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view sinistres"
ON public.sinistres
FOR SELECT
USING (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can insert sinistres"
ON public.sinistres
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can update sinistres"
ON public.sinistres
FOR UPDATE
USING (has_role(auth.uid(), 'agent'::app_role));

-- Infractions: agents can read, insert, update (but not delete)
DROP POLICY IF EXISTS "Agents can view infractions" ON public.infractions;
DROP POLICY IF EXISTS "Admins can manage infractions" ON public.infractions;
DROP POLICY IF EXISTS "Admins have full access to infractions" ON public.infractions;

CREATE POLICY "Admins can manage infractions"
ON public.infractions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view infractions"
ON public.infractions
FOR SELECT
USING (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can insert infractions"
ON public.infractions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can update infractions"
ON public.infractions
FOR UPDATE
USING (has_role(auth.uid(), 'agent'::app_role));

-- Vehicles: agents can update only kilometrage and statut
DROP POLICY IF EXISTS "Admins can manage vehicles" ON public.vehicles;

CREATE POLICY "Admins can manage vehicles"
ON public.vehicles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can update vehicles"
ON public.vehicles
FOR UPDATE
USING (has_role(auth.uid(), 'agent'::app_role));

-- Update the validation function to only allow kilometrage and statut changes for agents
CREATE OR REPLACE FUNCTION public.validate_agent_vehicle_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid();

  -- If admin, allow all modifications
  IF user_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- If agent, only allow kilometrage and statut changes
  IF user_role = 'agent' THEN
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
    
    IF OLD.photo_url IS DISTINCT FROM NEW.photo_url THEN
      RAISE EXCEPTION 'Les agents ne peuvent pas modifier la photo';
    END IF;
    
    -- Agents can only modify: kilometrage, statut, updated_at
    RETURN NEW;
  END IF;

  -- For other roles (comptable), block all modifications
  RAISE EXCEPTION 'Vous n''avez pas la permission de modifier les véhicules';
END;
$$;