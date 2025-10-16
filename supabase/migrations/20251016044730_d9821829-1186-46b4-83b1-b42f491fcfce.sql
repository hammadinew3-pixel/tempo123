-- ============================================
-- REFONTE DES MODULES FINANCIERS
-- ============================================

-- 1. Mise à jour de la table expenses existante
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS type_depense TEXT DEFAULT 'autre',
ADD COLUMN IF NOT EXISTS mode_paiement TEXT DEFAULT 'espece',
ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'paye',
ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS fournisseur TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Renommer le champ date_depense s'il n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'expenses' AND column_name = 'type_depense') THEN
    UPDATE public.expenses SET categorie = 'autre' WHERE categorie IS NULL;
  END IF;
END $$;

-- Trigger pour updated_at sur expenses
DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Créer la table revenus (encaissements)
CREATE TABLE IF NOT EXISTS public.revenus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_encaissement DATE NOT NULL,
  source_revenu TEXT NOT NULL DEFAULT 'contrat',
  montant NUMERIC NOT NULL,
  mode_paiement TEXT DEFAULT 'espece',
  statut TEXT DEFAULT 'paye',
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS sur revenus
ALTER TABLE public.revenus ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour revenus
CREATE POLICY "Admins can manage revenus"
  ON public.revenus
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view revenus"
  ON public.revenus
  FOR SELECT
  USING (true);

-- Trigger pour updated_at sur revenus
CREATE TRIGGER update_revenus_updated_at
  BEFORE UPDATE ON public.revenus
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Créer la table cheques
CREATE TABLE IF NOT EXISTS public.cheques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_cheque TEXT NOT NULL,
  banque TEXT,
  montant NUMERIC NOT NULL,
  date_emission DATE NOT NULL,
  date_echeance DATE NOT NULL,
  statut TEXT DEFAULT 'en_attente',
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS sur cheques
ALTER TABLE public.cheques ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour cheques
CREATE POLICY "Admins can manage cheques"
  ON public.cheques
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view cheques"
  ON public.cheques
  FOR SELECT
  USING (true);

-- Trigger pour updated_at sur cheques
CREATE TRIGGER update_cheques_updated_at
  BEFORE UPDATE ON public.cheques
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Créer la table traites
CREATE TABLE IF NOT EXISTS public.traites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_traite TEXT NOT NULL,
  banque TEXT,
  montant NUMERIC NOT NULL,
  date_echeance DATE NOT NULL,
  statut TEXT DEFAULT 'en_attente',
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  fournisseur TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS sur traites
ALTER TABLE public.traites ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour traites
CREATE POLICY "Admins can manage traites"
  ON public.traites
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view traites"
  ON public.traites
  FOR SELECT
  USING (true);

-- Trigger pour updated_at sur traites
CREATE TRIGGER update_traites_updated_at
  BEFORE UPDATE ON public.traites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();