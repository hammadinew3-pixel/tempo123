-- ============================================
-- VEHICLE CHANGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vehicle_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  old_vehicle_id UUID REFERENCES public.vehicles(id),
  new_vehicle_id UUID REFERENCES public.vehicles(id),
  change_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicle_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view vehicle changes" ON public.vehicle_changes;
CREATE POLICY "Authenticated users can view vehicle changes"
  ON public.vehicle_changes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage vehicle changes" ON public.vehicle_changes;
CREATE POLICY "Admins can manage vehicle changes"
  ON public.vehicle_changes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- SECONDARY DRIVERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.secondary_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  cin TEXT,
  permis_conduire TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.secondary_drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view secondary drivers" ON public.secondary_drivers;
CREATE POLICY "Authenticated users can view secondary drivers"
  ON public.secondary_drivers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage secondary drivers" ON public.secondary_drivers;
CREATE POLICY "Admins can manage secondary drivers"
  ON public.secondary_drivers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CONTRACT PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.contract_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  montant NUMERIC(10,2) NOT NULL,
  date_paiement DATE NOT NULL,
  methode payment_method DEFAULT 'especes',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.contract_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.contract_payments;
CREATE POLICY "Authenticated users can view payments"
  ON public.contract_payments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage payments" ON public.contract_payments;
CREATE POLICY "Admins can manage payments"
  ON public.contract_payments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  montant NUMERIC(10,2) NOT NULL,
  date_depense DATE NOT NULL,
  categorie TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view expenses" ON public.expenses;
CREATE POLICY "Authenticated users can view expenses"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage expenses" ON public.expenses;
CREATE POLICY "Admins can manage expenses"
  ON public.expenses FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ASSURANCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.assurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  actif BOOLEAN DEFAULT true,
  contact_nom TEXT,
  contact_telephone TEXT,
  contact_email TEXT,
  adresse TEXT,
  delai_paiement_jours INTEGER,
  conditions_paiement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.assurances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view assurances" ON public.assurances;
CREATE POLICY "Authenticated users can view assurances"
  ON public.assurances FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage assurances" ON public.assurances;
CREATE POLICY "Admins can manage assurances"
  ON public.assurances FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ASSURANCE BAREME TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.assurance_bareme (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assurance_id UUID REFERENCES public.assurances(id) ON DELETE CASCADE,
  categorie TEXT,
  tarif_journalier NUMERIC(10,2),
  description TEXT,
  montant NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.assurance_bareme ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view bareme" ON public.assurance_bareme;
CREATE POLICY "Authenticated users can view bareme"
  ON public.assurance_bareme FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage bareme" ON public.assurance_bareme;
CREATE POLICY "Admins can manage bareme"
  ON public.assurance_bareme FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- SINISTRES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sinistres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  date_sinistre DATE NOT NULL,
  description TEXT,
  montant NUMERIC(10,2),
  statut TEXT DEFAULT 'en_cours',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.sinistres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view sinistres" ON public.sinistres;
CREATE POLICY "Authenticated users can view sinistres"
  ON public.sinistres FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage sinistres" ON public.sinistres;
CREATE POLICY "Admins can manage sinistres"
  ON public.sinistres FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- INFRACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.infractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  date_infraction DATE NOT NULL,
  description TEXT,
  montant NUMERIC(10,2),
  statut TEXT DEFAULT 'non_payee',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.infractions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view infractions" ON public.infractions;
CREATE POLICY "Authenticated users can view infractions"
  ON public.infractions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage infractions" ON public.infractions;
CREATE POLICY "Admins can manage infractions"
  ON public.infractions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- VEHICULES TRAITES ECHEANCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vehicules_traites_echeances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type_echeance TEXT NOT NULL,
  date_traitee DATE NOT NULL,
  date_echeance DATE,
  date_paiement DATE,
  montant NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicules_traites_echeances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view echeances" ON public.vehicules_traites_echeances;
CREATE POLICY "Authenticated users can view echeances"
  ON public.vehicules_traites_echeances FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage echeances" ON public.vehicules_traites_echeances;
CREATE POLICY "Admins can manage echeances"
  ON public.vehicules_traites_echeances FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- AGENCE SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.agence_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT,
  adresse TEXT,
  telephone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.agence_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view settings" ON public.agence_settings;
CREATE POLICY "Everyone can view settings"
  ON public.agence_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON public.agence_settings;
CREATE POLICY "Admins can manage settings"
  ON public.agence_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- UPDATE ASSISTANCE TABLE WITH MISSING COLUMNS
-- ============================================
DO $$ BEGIN
  ALTER TABLE public.assistance ADD COLUMN IF NOT EXISTS type TEXT;
  ALTER TABLE public.assistance ADD COLUMN IF NOT EXISTS assureur_nom TEXT;
  ALTER TABLE public.assistance ADD COLUMN IF NOT EXISTS montant_paye NUMERIC(10,2);
  ALTER TABLE public.assistance ADD COLUMN IF NOT EXISTS franchise_montant NUMERIC(10,2);
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_assistance_updated_at ON public.assistance;
CREATE TRIGGER update_assistance_updated_at
  BEFORE UPDATE ON public.assistance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_agence_settings_updated_at ON public.agence_settings;
CREATE TRIGGER update_agence_settings_updated_at
  BEFORE UPDATE ON public.agence_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();