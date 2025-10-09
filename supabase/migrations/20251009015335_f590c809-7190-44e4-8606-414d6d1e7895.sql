-- Ajouter les colonnes de livraison/récupération aux contrats
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS delivery_type TEXT CHECK (delivery_type IN ('recupere', 'livre')),
ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_km INTEGER,
ADD COLUMN IF NOT EXISTS delivery_fuel_level TEXT,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS return_type TEXT CHECK (return_type IN ('recupere', 'rendu')),
ADD COLUMN IF NOT EXISTS return_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS return_km INTEGER,
ADD COLUMN IF NOT EXISTS return_fuel_level TEXT,
ADD COLUMN IF NOT EXISTS return_notes TEXT;

-- Créer la table pour les conducteurs secondaires
CREATE TABLE IF NOT EXISTS public.secondary_drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT,
  cin TEXT,
  permis_conduire TEXT,
  telephone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table secondary_drivers
ALTER TABLE public.secondary_drivers ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour secondary_drivers
CREATE POLICY "Authenticated users can view secondary drivers"
ON public.secondary_drivers
FOR SELECT
USING (true);

CREATE POLICY "Admins and agents can manage secondary drivers"
ON public.secondary_drivers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- Créer un trigger pour updated_at sur secondary_drivers
CREATE TRIGGER update_secondary_drivers_updated_at
BEFORE UPDATE ON public.secondary_drivers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Créer la table pour les paiements de contrats (si elle n'existe pas déjà dans une autre forme)
CREATE TABLE IF NOT EXISTS public.contract_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  montant NUMERIC NOT NULL,
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  methode payment_method NOT NULL,
  numero_cheque TEXT,
  banque TEXT,
  remarques TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table contract_payments
ALTER TABLE public.contract_payments ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour contract_payments
CREATE POLICY "Authenticated users can view contract payments"
ON public.contract_payments
FOR SELECT
USING (true);

CREATE POLICY "Comptables and admins can manage contract payments"
ON public.contract_payments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'comptable'::app_role));

-- Créer un trigger pour updated_at sur contract_payments
CREATE TRIGGER update_contract_payments_updated_at
BEFORE UPDATE ON public.contract_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();