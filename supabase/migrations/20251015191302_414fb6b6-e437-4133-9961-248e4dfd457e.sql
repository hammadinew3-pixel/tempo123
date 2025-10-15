-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.vehicle_status AS ENUM ('disponible', 'loue', 'reserve', 'en_panne', 'immobilise');
CREATE TYPE public.contract_status AS ENUM ('brouillon', 'ouvert', 'contrat_valide', 'livre', 'retour_effectue', 'termine', 'cloture', 'annule');
CREATE TYPE public.payment_status AS ENUM ('en_attente', 'paye', 'partiellement_paye');
CREATE TYPE public.payment_method AS ENUM ('especes', 'carte_bancaire', 'virement', 'cheque');

-- ============================================
-- USER ROLES TABLE
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'particulier',
  nom TEXT NOT NULL,
  prenom TEXT,
  cin TEXT,
  permis_conduire TEXT,
  email TEXT,
  telephone TEXT NOT NULL,
  adresse TEXT,
  cin_url TEXT,
  permis_url TEXT,
  sexe TEXT,
  client_fiable TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- VEHICLES TABLE
-- ============================================
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  immatriculation TEXT NOT NULL UNIQUE,
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  annee INTEGER,
  kilometrage INTEGER DEFAULT 0,
  statut vehicle_status DEFAULT 'disponible',
  tarif_journalier NUMERIC(10,2) DEFAULT 0,
  valeur_achat NUMERIC(10,2),
  categorie TEXT,
  en_service BOOLEAN DEFAULT true,
  sous_location BOOLEAN DEFAULT false,
  dernier_kilometrage_vidange INTEGER,
  prochain_kilometrage_vidange INTEGER,
  visite_technique_expire_le DATE,
  vignette_expire_le DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vehicles"
  ON public.vehicles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert vehicles"
  ON public.vehicles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update vehicles"
  ON public.vehicles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vehicles"
  ON public.vehicles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CONTRACTS TABLE
-- ============================================
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_contrat TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  statut contract_status DEFAULT 'brouillon',
  caution_montant NUMERIC(10,2) DEFAULT 0,
  caution_statut TEXT DEFAULT 'bloquee',
  advance_payment NUMERIC(10,2) DEFAULT 0,
  remaining_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  payment_method payment_method DEFAULT 'especes',
  start_location TEXT,
  end_location TEXT,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  pdf_url TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contracts"
  ON public.contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage contracts"
  ON public.contracts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ASSISTANCE TABLE
-- ============================================
CREATE TABLE public.assistance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  num_dossier TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  etat TEXT DEFAULT 'en_cours',
  etat_paiement payment_status DEFAULT 'en_attente',
  montant_total NUMERIC(10,2),
  montant_facture NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.assistance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view assistance"
  ON public.assistance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage assistance"
  ON public.assistance FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- VEHICLE INSURANCE TABLE
-- ============================================
CREATE TABLE public.vehicle_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  assureur TEXT NOT NULL,
  numero_police TEXT,
  date_debut DATE NOT NULL,
  date_expiration DATE NOT NULL,
  montant NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicle_insurance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vehicle insurance"
  ON public.vehicle_insurance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage vehicle insurance"
  ON public.vehicle_insurance FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- VEHICLE TECHNICAL INSPECTION TABLE
-- ============================================
CREATE TABLE public.vehicle_technical_inspection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  date_visite DATE NOT NULL,
  date_expiration DATE NOT NULL,
  resultat TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicle_technical_inspection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view technical inspections"
  ON public.vehicle_technical_inspection FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage technical inspections"
  ON public.vehicle_technical_inspection FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- VEHICLE VIGNETTE TABLE
-- ============================================
CREATE TABLE public.vehicle_vignette (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  date_debut DATE NOT NULL,
  date_expiration DATE NOT NULL,
  montant NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicle_vignette ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vignettes"
  ON public.vehicle_vignette FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage vignettes"
  ON public.vehicle_vignette FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- VEHICLE CHANGES TABLE
-- ============================================
CREATE TABLE public.vehicle_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  old_vehicle_id UUID REFERENCES public.vehicles(id),
  new_vehicle_id UUID REFERENCES public.vehicles(id),
  change_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicle_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vehicle changes"
  ON public.vehicle_changes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage vehicle changes"
  ON public.vehicle_changes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- SECONDARY DRIVERS TABLE
-- ============================================
CREATE TABLE public.secondary_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  cin TEXT,
  permis_conduire TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.secondary_drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view secondary drivers"
  ON public.secondary_drivers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage secondary drivers"
  ON public.secondary_drivers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CONTRACT PAYMENTS TABLE
-- ============================================
CREATE TABLE public.contract_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  montant NUMERIC(10,2) NOT NULL,
  date_paiement DATE NOT NULL,
  methode payment_method DEFAULT 'especes',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.contract_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view payments"
  ON public.contract_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage payments"
  ON public.contract_payments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  montant NUMERIC(10,2) NOT NULL,
  date_depense DATE NOT NULL,
  categorie TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view expenses"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage expenses"
  ON public.expenses FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ASSURANCES TABLE (Companies)
-- ============================================
CREATE TABLE public.assurances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.assurances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view assurances"
  ON public.assurances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage assurances"
  ON public.assurances FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ASSURANCE BAREME TABLE
-- ============================================
CREATE TABLE public.assurance_bareme (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assurance_id UUID REFERENCES public.assurances(id) ON DELETE CASCADE,
  description TEXT,
  montant NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.assurance_bareme ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view bareme"
  ON public.assurance_bareme FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage bareme"
  ON public.assurance_bareme FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- SINISTRES TABLE
-- ============================================
CREATE TABLE public.sinistres (
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

CREATE POLICY "Authenticated users can view sinistres"
  ON public.sinistres FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage sinistres"
  ON public.sinistres FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- INFRACTIONS TABLE
-- ============================================
CREATE TABLE public.infractions (
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

CREATE POLICY "Authenticated users can view infractions"
  ON public.infractions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage infractions"
  ON public.infractions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- VEHICULES TRAITES ECHEANCES TABLE
-- ============================================
CREATE TABLE public.vehicules_traites_echeances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type_echeance TEXT NOT NULL,
  date_traitee DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicules_traites_echeances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view echeances"
  ON public.vehicules_traites_echeances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage echeances"
  ON public.vehicules_traites_echeances FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE public.audit_logs (
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

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- AGENCE SETTINGS TABLE
-- ============================================
CREATE TABLE public.agence_settings (
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

CREATE POLICY "Everyone can view settings"
  ON public.agence_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.agence_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

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

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assistance_updated_at
  BEFORE UPDATE ON public.assistance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agence_settings_updated_at
  BEFORE UPDATE ON public.agence_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();