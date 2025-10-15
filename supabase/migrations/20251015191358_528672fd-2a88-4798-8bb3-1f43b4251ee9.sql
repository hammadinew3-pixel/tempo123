-- Check and create enum types only if they don't exist
DO $$ BEGIN
    CREATE TYPE public.vehicle_status AS ENUM ('disponible', 'loue', 'reserve', 'en_panne', 'immobilise');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.contract_status AS ENUM ('brouillon', 'ouvert', 'contrat_valide', 'livre', 'retour_effectue', 'termine', 'cloture', 'annule');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('en_attente', 'paye', 'partiellement_paye');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_method AS ENUM ('especes', 'carte_bancaire', 'virement', 'cheque');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Security definer function for role checking (if not exists)
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

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.clients (
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

DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
CREATE POLICY "Authenticated users can view clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert clients" ON public.clients;
CREATE POLICY "Admins can insert clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update clients" ON public.clients;
CREATE POLICY "Admins can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
CREATE POLICY "Admins can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- VEHICLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vehicles (
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

DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON public.vehicles;
CREATE POLICY "Authenticated users can view vehicles"
  ON public.vehicles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert vehicles" ON public.vehicles;
CREATE POLICY "Admins can insert vehicles"
  ON public.vehicles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update vehicles" ON public.vehicles;
CREATE POLICY "Admins can update vehicles"
  ON public.vehicles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete vehicles" ON public.vehicles;
CREATE POLICY "Admins can delete vehicles"
  ON public.vehicles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CONTRACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.contracts (
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

DROP POLICY IF EXISTS "Authenticated users can view contracts" ON public.contracts;
CREATE POLICY "Authenticated users can view contracts"
  ON public.contracts FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage contracts" ON public.contracts;
CREATE POLICY "Admins can manage contracts"
  ON public.contracts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- ASSISTANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.assistance (
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

DROP POLICY IF EXISTS "Authenticated users can view assistance" ON public.assistance;
CREATE POLICY "Authenticated users can view assistance"
  ON public.assistance FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage assistance" ON public.assistance;
CREATE POLICY "Admins can manage assistance"
  ON public.assistance FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- VEHICLE INSURANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vehicle_insurance (
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

DROP POLICY IF EXISTS "Authenticated users can view vehicle insurance" ON public.vehicle_insurance;
CREATE POLICY "Authenticated users can view vehicle insurance"
  ON public.vehicle_insurance FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage vehicle insurance" ON public.vehicle_insurance;
CREATE POLICY "Admins can manage vehicle insurance"
  ON public.vehicle_insurance FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- VEHICLE TECHNICAL INSPECTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vehicle_technical_inspection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  date_visite DATE NOT NULL,
  date_expiration DATE NOT NULL,
  resultat TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicle_technical_inspection ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view technical inspections" ON public.vehicle_technical_inspection;
CREATE POLICY "Authenticated users can view technical inspections"
  ON public.vehicle_technical_inspection FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage technical inspections" ON public.vehicle_technical_inspection;
CREATE POLICY "Admins can manage technical inspections"
  ON public.vehicle_technical_inspection FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- VEHICLE VIGNETTE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vehicle_vignette (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  date_debut DATE NOT NULL,
  date_expiration DATE NOT NULL,
  montant NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicle_vignette ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view vignettes" ON public.vehicle_vignette;
CREATE POLICY "Authenticated users can view vignettes"
  ON public.vehicle_vignette FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage vignettes" ON public.vehicle_vignette;
CREATE POLICY "Admins can manage vignettes"
  ON public.vehicle_vignette FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Continuer dans le prochain message...