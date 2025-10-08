-- Drop all existing tables to rebuild as single-tenant
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.assistance CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.vehicles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.has_role CASCADE;
DROP FUNCTION IF EXISTS public.get_user_tenant_id CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.calculate_invoice_ttc CASCADE;
DROP FUNCTION IF EXISTS public.update_vehicle_status_on_contract_change CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.plan_type CASCADE;
DROP TYPE IF EXISTS public.vehicle_status CASCADE;
DROP TYPE IF EXISTS public.contract_status CASCADE;
DROP TYPE IF EXISTS public.caution_status CASCADE;
DROP TYPE IF EXISTS public.client_type CASCADE;
DROP TYPE IF EXISTS public.expense_category CASCADE;
DROP TYPE IF EXISTS public.payment_method CASCADE;
DROP TYPE IF EXISTS public.assistance_status CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;

-- Create enums for single-tenant app
CREATE TYPE public.app_role AS ENUM ('admin', 'agent', 'comptable');
CREATE TYPE public.vehicle_status AS ENUM ('disponible', 'reserve', 'loue', 'en_panne');
CREATE TYPE public.contract_status AS ENUM ('brouillon', 'actif', 'termine', 'annule');
CREATE TYPE public.caution_status AS ENUM ('bloquee', 'utilisee', 'remboursee');
CREATE TYPE public.client_type AS ENUM ('particulier', 'entreprise');
CREATE TYPE public.expense_category AS ENUM ('entretien', 'assurance', 'loyer', 'marketing', 'salaires', 'autres');
CREATE TYPE public.payment_method AS ENUM ('especes', 'virement', 'carte', 'cheque');
CREATE TYPE public.assistance_type AS ENUM ('remplacement', 'prolongation');
CREATE TYPE public.assistance_status AS ENUM ('ouvert', 'cloture');
CREATE TYPE public.notification_type AS ENUM ('expiration', 'contrat', 'paiement', 'autre');

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  email TEXT NOT NULL,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER ROLES TABLE
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VEHICLES TABLE
-- ============================================
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  immatriculation TEXT UNIQUE NOT NULL,
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  annee INTEGER NOT NULL,
  kilometrage INTEGER NOT NULL DEFAULT 0,
  statut vehicle_status NOT NULL DEFAULT 'disponible',
  assurance_expire_le DATE,
  vignette_expire_le DATE,
  visite_technique_expire_le DATE,
  valeur_achat DECIMAL(10, 2),
  tarif_journalier DECIMAL(10, 2) NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type client_type NOT NULL DEFAULT 'particulier',
  nom TEXT NOT NULL,
  prenom TEXT,
  cin TEXT,
  permis_conduire TEXT,
  email TEXT,
  telephone TEXT NOT NULL,
  adresse TEXT,
  cin_url TEXT,
  permis_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CONTRACTS TABLE
-- ============================================
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_contrat TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE RESTRICT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  statut contract_status NOT NULL DEFAULT 'brouillon',
  caution_montant DECIMAL(10, 2) NOT NULL DEFAULT 0,
  caution_statut caution_status NOT NULL DEFAULT 'bloquee',
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ASSISTANCE TABLE
-- ============================================
CREATE TABLE public.assistance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  num_dossier TEXT UNIQUE NOT NULL,
  assureur_nom TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  date_debut DATE NOT NULL,
  date_fin DATE,
  type assistance_type NOT NULL,
  montant_facture DECIMAL(10, 2),
  etat assistance_status NOT NULL DEFAULT 'ouvert',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assistance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  categorie expense_category NOT NULL,
  montant DECIMAL(10, 2) NOT NULL,
  date_depense DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  justificatif_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_facture TEXT UNIQUE NOT NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  montant_ht DECIMAL(10, 2) NOT NULL,
  taux_tva DECIMAL(5, 2) NOT NULL DEFAULT 20,
  montant_ttc DECIMAL(10, 2) NOT NULL,
  payee BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  montant DECIMAL(10, 2) NOT NULL,
  date_paiement DATE NOT NULL DEFAULT CURRENT_DATE,
  methode payment_method NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  message TEXT NOT NULL,
  lu BOOLEAN NOT NULL DEFAULT false,
  cree_le TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- User Roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Vehicles - All authenticated users can view
CREATE POLICY "Authenticated users can view vehicles"
ON public.vehicles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and agents can insert vehicles"
ON public.vehicles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'agent')
  )
);

CREATE POLICY "Admins and agents can update vehicles"
ON public.vehicles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'agent')
  )
);

CREATE POLICY "Admins can delete vehicles"
ON public.vehicles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Clients
CREATE POLICY "Authenticated users can view clients"
ON public.clients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and agents can manage clients"
ON public.clients FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'agent')
  )
);

-- Contracts
CREATE POLICY "Authenticated users can view contracts"
ON public.contracts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and agents can manage contracts"
ON public.contracts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'agent')
  )
);

-- Assistance, Expenses, Invoices, Payments, Notifications
CREATE POLICY "Authenticated users can view assistance"
ON public.assistance FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view expenses"
ON public.expenses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view invoices"
ON public.invoices FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view payments"
ON public.payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Comptables and admins can manage invoices"
ON public.invoices FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'comptable')
  )
);

CREATE POLICY "Comptables and admins can manage payments"
ON public.payments FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'comptable')
  )
);

CREATE POLICY "Admins can manage expenses"
ON public.expenses FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assistance_updated_at BEFORE UPDATE ON public.assistance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nom, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-calculate invoice TTC
CREATE OR REPLACE FUNCTION public.calculate_invoice_ttc()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.montant_ttc := NEW.montant_ht * (1 + NEW.taux_tva / 100);
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_invoice_ttc_trigger
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.calculate_invoice_ttc();

-- Update vehicle status on contract change
CREATE OR REPLACE FUNCTION public.update_vehicle_status_on_contract_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.statut = 'actif' THEN
    UPDATE public.vehicles SET statut = 'loue' WHERE id = NEW.vehicle_id;
  ELSIF NEW.statut IN ('termine', 'annule') AND OLD.statut = 'actif' THEN
    UPDATE public.vehicles SET statut = 'disponible' WHERE id = NEW.vehicle_id;
    IF NEW.statut = 'termine' THEN
      NEW.caution_statut := 'remboursee';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_vehicle_status_trigger
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION public.update_vehicle_status_on_contract_change();