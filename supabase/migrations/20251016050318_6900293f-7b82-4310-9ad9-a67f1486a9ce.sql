-- Supprimer l'ancienne table traites si elle existe
DROP TABLE IF EXISTS public.traites CASCADE;

-- Modifier la table cheques existante pour ajouter les nouveaux champs
ALTER TABLE public.cheques 
  ADD COLUMN IF NOT EXISTS type_cheque TEXT,
  ADD COLUMN IF NOT EXISTS date_encaissement DATE,
  ADD COLUMN IF NOT EXISTS date_paiement DATE,
  ADD COLUMN IF NOT EXISTS revenu_id UUID REFERENCES public.revenus(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS depense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fournisseur TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Mettre à jour le champ statut pour accepter les nouvelles valeurs
ALTER TABLE public.cheques DROP CONSTRAINT IF EXISTS cheques_statut_check;
ALTER TABLE public.cheques ADD CONSTRAINT cheques_statut_check 
  CHECK (statut IN ('en_attente', 'encaissé', 'payé', 'rejeté'));

-- Ajouter la contrainte pour type_cheque
ALTER TABLE public.cheques DROP CONSTRAINT IF EXISTS cheques_type_cheque_check;
ALTER TABLE public.cheques ADD CONSTRAINT cheques_type_cheque_check 
  CHECK (type_cheque IN ('reçu', 'émis'));

-- Mettre à jour les chèques existants avec un type par défaut
UPDATE public.cheques SET type_cheque = 'reçu' WHERE type_cheque IS NULL;

-- Rendre type_cheque obligatoire
ALTER TABLE public.cheques ALTER COLUMN type_cheque SET NOT NULL;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cheques_type ON public.cheques(type_cheque);
CREATE INDEX IF NOT EXISTS idx_cheques_statut ON public.cheques(statut);
CREATE INDEX IF NOT EXISTS idx_cheques_client ON public.cheques(client_id);
CREATE INDEX IF NOT EXISTS idx_cheques_contract ON public.cheques(contract_id);
CREATE INDEX IF NOT EXISTS idx_cheques_echeance ON public.cheques(date_echeance);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_cheques_updated_at ON public.cheques;
CREATE TRIGGER update_cheques_updated_at
  BEFORE UPDATE ON public.cheques
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();