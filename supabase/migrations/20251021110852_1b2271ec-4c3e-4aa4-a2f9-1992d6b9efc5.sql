-- 1. Corriger le trigger create_expense_for_vignette pour ajouter une description par défaut
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
      'document',
      'Vignette',
      'paye',
      COALESCE(NEW.mode_paiement, 'espece'),
      NEW.tenant_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Ajouter les colonnes manquantes dans la table vehicles
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS numero_chassis TEXT,
ADD COLUMN IF NOT EXISTS couleur TEXT,
ADD COLUMN IF NOT EXISTS concessionnaire TEXT,
ADD COLUMN IF NOT EXISTS puissance_fiscale INTEGER,
ADD COLUMN IF NOT EXISTS nombre_places INTEGER,
ADD COLUMN IF NOT EXISTS date_mise_en_circulation DATE;

-- 3. Créer la table pour l'autorisation de circulation
CREATE TABLE IF NOT EXISTS public.vehicle_autorisation_circulation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  numero_ordre TEXT,
  date_delivrance DATE NOT NULL,
  date_expiration DATE NOT NULL,
  montant NUMERIC,
  date_paiement DATE,
  mode_paiement TEXT CHECK (mode_paiement IN ('especes', 'cheque', 'virement', 'carte')),
  numero_cheque TEXT,
  banque TEXT,
  photo_url TEXT,
  remarques TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_vehicle_autorisation_circulation_vehicle_id 
ON public.vehicle_autorisation_circulation(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_autorisation_circulation_tenant_id 
ON public.vehicle_autorisation_circulation(tenant_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE TRIGGER update_vehicle_autorisation_circulation_updated_at
BEFORE UPDATE ON public.vehicle_autorisation_circulation
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS pour vehicle_autorisation_circulation
ALTER TABLE public.vehicle_autorisation_circulation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant autorisation circulation"
ON public.vehicle_autorisation_circulation
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

CREATE POLICY "Agents can insert autorisation circulation in their tenant"
ON public.vehicle_autorisation_circulation
FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND 
            tenant_is_active(auth.uid()) = true AND 
            (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Agents can update autorisation circulation in their tenant"
ON public.vehicle_autorisation_circulation
FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()) AND 
       tenant_is_active(auth.uid()) = true AND 
       (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Admins can delete autorisation circulation in their tenant"
ON public.vehicle_autorisation_circulation
FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()) AND 
       has_role(auth.uid(), 'admin'::app_role));

-- Créer le bucket pour les autorisations de circulation
INSERT INTO storage.buckets (id, name, public)
VALUES ('autorisation-circulation', 'autorisation-circulation', false)
ON CONFLICT (id) DO NOTHING;

-- RLS pour le bucket autorisation-circulation
CREATE POLICY "Users can view their tenant autorisation circulation files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'autorisation-circulation' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Agents can upload autorisation circulation files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'autorisation-circulation' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Agents can update their autorisation circulation files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'autorisation-circulation' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can delete autorisation circulation files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'autorisation-circulation' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Trigger pour créer une dépense lors de l'ajout d'une autorisation de circulation
CREATE OR REPLACE FUNCTION public.create_expense_for_autorisation()
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
      'Autorisation de circulation - ' || TO_CHAR(NEW.date_delivrance, 'DD/MM/YYYY'),
      'document',
      'Autorisation de circulation',
      'paye',
      COALESCE(NEW.mode_paiement, 'especes'),
      NEW.tenant_id
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER create_expense_for_autorisation_trigger
AFTER INSERT ON public.vehicle_autorisation_circulation
FOR EACH ROW
EXECUTE FUNCTION public.create_expense_for_autorisation();

-- 4. Ajouter les colonnes manquantes dans la table clients
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS sexe TEXT CHECK (sexe IN ('Homme', 'Femme')),
ADD COLUMN IF NOT EXISTS passeport TEXT,
ADD COLUMN IF NOT EXISTS date_naissance DATE,
ADD COLUMN IF NOT EXISTS date_delivrance_permis DATE,
ADD COLUMN IF NOT EXISTS date_expiration_permis DATE,
ADD COLUMN IF NOT EXISTS centre_delivrance_permis TEXT,
ADD COLUMN IF NOT EXISTS raison_sociale TEXT,
ADD COLUMN IF NOT EXISTS ice TEXT;

-- Ajouter un commentaire pour expliquer le champ client_fiable existant
COMMENT ON COLUMN public.clients.client_fiable IS 'Indicateur de fiabilité du client';