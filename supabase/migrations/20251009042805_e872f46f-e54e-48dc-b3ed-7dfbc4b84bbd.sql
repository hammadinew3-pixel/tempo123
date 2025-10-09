-- Ajouter les colonnes pour gérer la franchise et le paiement dans assistance

-- Ajouter le statut de la franchise (comme la caution dans contracts)
ALTER TABLE public.assistance 
ADD COLUMN IF NOT EXISTS franchise_statut text DEFAULT 'bloquee' CHECK (franchise_statut IN ('bloquee', 'remboursee', 'utilisee'));

-- Ajouter le statut de paiement (pour gérer la clôture en deux niveaux)
ALTER TABLE public.assistance 
ADD COLUMN IF NOT EXISTS etat_paiement text DEFAULT 'en_attente' CHECK (etat_paiement IN ('en_attente', 'paye', 'partiellement_paye'));

-- Ajouter une colonne pour le montant payé par l'assurance
ALTER TABLE public.assistance 
ADD COLUMN IF NOT EXISTS montant_paye numeric DEFAULT 0;

-- Ajouter une colonne pour les notes sur la franchise
ALTER TABLE public.assistance 
ADD COLUMN IF NOT EXISTS franchise_notes text;

-- Ajouter une colonne pour la date de paiement par l'assurance
ALTER TABLE public.assistance 
ADD COLUMN IF NOT EXISTS date_paiement_assurance date;

-- Add comments for documentation
COMMENT ON COLUMN public.assistance.franchise_statut IS 'Statut de la franchise: bloquee (en attente), remboursee (rendue au client), utilisee (déduite pour dommages)';
COMMENT ON COLUMN public.assistance.etat_paiement IS 'Statut du paiement par l''assurance: en_attente, paye, partiellement_paye';
COMMENT ON COLUMN public.assistance.montant_paye IS 'Montant déjà payé par l''assurance';
COMMENT ON COLUMN public.assistance.date_paiement_assurance IS 'Date du paiement par l''assurance';