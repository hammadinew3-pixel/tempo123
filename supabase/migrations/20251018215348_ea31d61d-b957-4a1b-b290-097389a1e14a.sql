-- Création des tables du module Comptabilité (PCG Marocain)

-- Table des comptes (plan comptable)
CREATE TABLE IF NOT EXISTS public.acc_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des journaux
CREATE TABLE IF NOT EXISTS public.acc_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  sequence INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des pièces comptables (écritures)
CREATE TABLE IF NOT EXISTS public.acc_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES public.acc_journals(id),
  doc_type TEXT NOT NULL CHECK (doc_type IN ('CONTRACT', 'INVOICE', 'PAYMENT', 'EXPENSE', 'CHEQUE_IN', 'CHEQUE_OUT', 'ADJUST')),
  doc_id UUID,
  date_entry DATE NOT NULL,
  ref_number TEXT NOT NULL,
  memo TEXT,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des lignes d'écriture
CREATE TABLE IF NOT EXISTS public.acc_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.acc_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.acc_accounts(id),
  partner_name TEXT,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  tax_code TEXT,
  vehicle_id UUID REFERENCES public.vehicles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT check_debit_credit CHECK (debit >= 0 AND credit >= 0)
);

-- Table des paramètres TVA
CREATE TABLE IF NOT EXISTS public.acc_tax_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  rate NUMERIC NOT NULL,
  sales_account_id UUID REFERENCES public.acc_accounts(id),
  purchase_account_id UUID REFERENCES public.acc_accounts(id),
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des paramètres comptables
CREATE TABLE IF NOT EXISTS public.acc_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_account_id UUID REFERENCES public.acc_accounts(id),
  cash_account_id UUID REFERENCES public.acc_accounts(id),
  bank_account_id UUID REFERENCES public.acc_accounts(id),
  ar_account_id UUID REFERENCES public.acc_accounts(id),
  ap_account_id UUID REFERENCES public.acc_accounts(id),
  expense_default_account_id UUID REFERENCES public.acc_accounts(id),
  cheque_received_account_id UUID REFERENCES public.acc_accounts(id),
  cheque_issued_account_id UUID REFERENCES public.acc_accounts(id),
  rounding_account_id UUID REFERENCES public.acc_accounts(id),
  next_ref_sales INTEGER DEFAULT 1,
  next_ref_purchases INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trigger pour updated_at
CREATE TRIGGER update_acc_accounts_updated_at
  BEFORE UPDATE ON public.acc_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_acc_journals_updated_at
  BEFORE UPDATE ON public.acc_journals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_acc_entries_updated_at
  BEFORE UPDATE ON public.acc_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_acc_entry_lines_updated_at
  BEFORE UPDATE ON public.acc_entry_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_acc_tax_settings_updated_at
  BEFORE UPDATE ON public.acc_tax_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_acc_settings_updated_at
  BEFORE UPDATE ON public.acc_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.acc_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acc_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acc_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acc_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acc_tax_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acc_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage accounts" ON public.acc_accounts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view accounts" ON public.acc_accounts FOR SELECT USING (true);

CREATE POLICY "Admins can manage journals" ON public.acc_journals FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view journals" ON public.acc_journals FOR SELECT USING (true);

CREATE POLICY "Admins can manage entries" ON public.acc_entries FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view entries" ON public.acc_entries FOR SELECT USING (true);

CREATE POLICY "Admins can manage entry lines" ON public.acc_entry_lines FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view entry lines" ON public.acc_entry_lines FOR SELECT USING (true);

CREATE POLICY "Admins can manage tax settings" ON public.acc_tax_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view tax settings" ON public.acc_tax_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage acc settings" ON public.acc_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view acc settings" ON public.acc_settings FOR SELECT USING (true);

-- Seed des journaux par défaut
INSERT INTO public.acc_journals (code, label, sequence) VALUES
('VEN', 'Ventes', 1),
('ACH', 'Achats', 1),
('BNK', 'Banque', 1),
('CAI', 'Caisse', 1),
('OD', 'Opérations Diverses', 1)
ON CONFLICT (code) DO NOTHING;

-- Seed des comptes par défaut (PCG Marocain)
INSERT INTO public.acc_accounts (code, label, type) VALUES
-- Actif
('341100', 'Clients', 'asset'),
('345100', 'TVA déductible', 'asset'),
('511300', 'Chèques à encaisser', 'asset'),
('512100', 'Banque', 'asset'),
('531100', 'Caisse', 'asset'),
-- Passif
('441100', 'Fournisseurs', 'liability'),
('445700', 'TVA collectée', 'liability'),
('511400', 'Chèques à payer', 'liability'),
-- Produits
('701100', 'Ventes de services - Location', 'revenue'),
('758000', 'Produits divers de gestion', 'revenue'),
-- Charges
('611100', 'Charges entretien et réparations', 'expense'),
('612100', 'Assurances', 'expense'),
('658000', 'Charges diverses de gestion', 'expense')
ON CONFLICT (code) DO NOTHING;

-- Seed des taux de TVA
DO $$
DECLARE
  tva_collectee_id UUID;
  tva_deductible_id UUID;
BEGIN
  SELECT id INTO tva_collectee_id FROM public.acc_accounts WHERE code = '445700';
  SELECT id INTO tva_deductible_id FROM public.acc_accounts WHERE code = '345100';
  
  INSERT INTO public.acc_tax_settings (code, rate, sales_account_id, purchase_account_id, label) VALUES
  ('TVA20', 0.20, tva_collectee_id, tva_deductible_id, 'TVA 20%'),
  ('TVA10', 0.10, tva_collectee_id, tva_deductible_id, 'TVA 10%'),
  ('TVA7', 0.07, tva_collectee_id, tva_deductible_id, 'TVA 7%'),
  ('TVA0', 0.00, tva_collectee_id, tva_deductible_id, 'TVA 0%'),
  ('EXO', 0.00, tva_collectee_id, tva_deductible_id, 'Exonéré'),
  ('NA', 0.00, tva_collectee_id, tva_deductible_id, 'Non assujetti')
  ON CONFLICT (code) DO NOTHING;
END $$;

-- Seed des paramètres comptables par défaut
DO $$
DECLARE
  sales_acc UUID;
  cash_acc UUID;
  bank_acc UUID;
  ar_acc UUID;
  ap_acc UUID;
  expense_acc UUID;
  cheque_rec_acc UUID;
  cheque_iss_acc UUID;
  rounding_acc UUID;
BEGIN
  SELECT id INTO sales_acc FROM public.acc_accounts WHERE code = '701100';
  SELECT id INTO cash_acc FROM public.acc_accounts WHERE code = '531100';
  SELECT id INTO bank_acc FROM public.acc_accounts WHERE code = '512100';
  SELECT id INTO ar_acc FROM public.acc_accounts WHERE code = '341100';
  SELECT id INTO ap_acc FROM public.acc_accounts WHERE code = '441100';
  SELECT id INTO expense_acc FROM public.acc_accounts WHERE code = '611100';
  SELECT id INTO cheque_rec_acc FROM public.acc_accounts WHERE code = '511300';
  SELECT id INTO cheque_iss_acc FROM public.acc_accounts WHERE code = '511400';
  SELECT id INTO rounding_acc FROM public.acc_accounts WHERE code = '658000';
  
  INSERT INTO public.acc_settings (
    sales_account_id, 
    cash_account_id, 
    bank_account_id, 
    ar_account_id, 
    ap_account_id,
    expense_default_account_id,
    cheque_received_account_id,
    cheque_issued_account_id,
    rounding_account_id
  ) VALUES (
    sales_acc, 
    cash_acc, 
    bank_acc, 
    ar_acc, 
    ap_acc,
    expense_acc,
    cheque_rec_acc,
    cheque_iss_acc,
    rounding_acc
  );
END $$;