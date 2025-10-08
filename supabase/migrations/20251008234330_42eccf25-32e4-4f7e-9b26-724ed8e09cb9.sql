-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'agent', 'comptable');

-- Create plan enum for tenant plans
CREATE TYPE public.plan_type AS ENUM ('essentiel', 'standard', 'premium');

-- Create vehicle status enum
CREATE TYPE public.vehicle_status AS ENUM ('disponible', 'reserve', 'loue', 'en_panne');

-- Create contract status enum
CREATE TYPE public.contract_status AS ENUM ('brouillon', 'actif', 'termine', 'annule');

-- Create caution status enum
CREATE TYPE public.caution_status AS ENUM ('bloquee', 'utilisee', 'remboursee');

-- Create client type enum
CREATE TYPE public.client_type AS ENUM ('particulier', 'entreprise');

-- Create expense category enum
CREATE TYPE public.expense_category AS ENUM ('entretien', 'assurance', 'salaires', 'autres');

-- Create payment method enum
CREATE TYPE public.payment_method AS ENUM ('especes', 'virement', 'carte', 'cheque');

-- Create assistance status enum
CREATE TYPE public.assistance_status AS ENUM ('ouvert', 'cloture');

-- Create notification type enum
CREATE TYPE public.notification_type AS ENUM ('expiration', 'contrat', 'paiement', 'autre');

-- ============================================
-- TENANTS TABLE
-- ============================================
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_agence TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email_contact TEXT NOT NULL,
  adresse TEXT,
  telephone TEXT,
  plan plan_type NOT NULL DEFAULT 'essentiel',
  actif BOOLEAN NOT NULL DEFAULT true,
  logo_url TEXT,
  date_inscription TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paiement_valide BOOLEAN NOT NULL DEFAULT false,
  justificatif_virement_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE (linked to auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
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
-- SECURITY DEFINER FUNCTION FOR ROLE CHECKING
-- ============================================
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
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ============================================
-- FUNCTION TO GET USER'S TENANT_ID
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- ============================================
-- VEHICLES TABLE
-- ============================================
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  immatriculation TEXT NOT NULL,
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, immatriculation)
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
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
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE RESTRICT NOT NULL,
  numero_contrat TEXT NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  statut contract_status NOT NULL DEFAULT 'brouillon',
  caution_montant DECIMAL(10, 2) NOT NULL DEFAULT 0,
  caution_statut caution_status NOT NULL DEFAULT 'bloquee',
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, numero_contrat)
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ASSISTANCE TABLE
-- ============================================
CREATE TABLE public.assistance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  num_dossier TEXT NOT NULL,
  assureur_nom TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  date_debut DATE NOT NULL,
  date_fin DATE,
  montant_facture DECIMAL(10, 2),
  etat assistance_status NOT NULL DEFAULT 'ouvert',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, num_dossier)
);

ALTER TABLE public.assistance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
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
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  numero_facture TEXT NOT NULL,
  date_emission DATE NOT NULL DEFAULT CURRENT_DATE,
  montant_ht DECIMAL(10, 2) NOT NULL,
  taux_tva DECIMAL(5, 2) NOT NULL DEFAULT 20,
  montant_ttc DECIMAL(10, 2) NOT NULL,
  payee BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, numero_facture)
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
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
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  message TEXT NOT NULL,
  lu BOOLEAN NOT NULL DEFAULT false,
  cree_le TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - TENANTS
-- ============================================
-- Superadmin can view all tenants
CREATE POLICY "Superadmin can view all tenants"
ON public.tenants FOR SELECT
USING (public.has_role(auth.uid(), 'superadmin'));

-- Superadmin can insert tenants
CREATE POLICY "Superadmin can insert tenants"
ON public.tenants FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Superadmin can update tenants
CREATE POLICY "Superadmin can update tenants"
ON public.tenants FOR UPDATE
USING (public.has_role(auth.uid(), 'superadmin'));

-- Users can view their own tenant
CREATE POLICY "Users can view their own tenant"
ON public.tenants FOR SELECT
USING (id = public.get_user_tenant_id(auth.uid()));

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- Superadmin can view all profiles
CREATE POLICY "Superadmin can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'superadmin'));

-- Superadmin can insert profiles
CREATE POLICY "Superadmin can insert profiles"
ON public.profiles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Admins can view profiles in their tenant
CREATE POLICY "Admins can view tenant profiles"
ON public.profiles FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') AND 
  tenant_id = public.get_user_tenant_id(auth.uid())
);

-- ============================================
-- RLS POLICIES - USER ROLES
-- ============================================
-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Superadmin can manage all roles
CREATE POLICY "Superadmin can manage all roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));

-- ============================================
-- RLS POLICIES - VEHICLES
-- ============================================
-- Users can view vehicles in their tenant
CREATE POLICY "Users can view tenant vehicles"
ON public.vehicles FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) OR
  public.has_role(auth.uid(), 'superadmin')
);

-- Admins and agents can insert vehicles
CREATE POLICY "Admins and agents can insert vehicles"
ON public.vehicles FOR INSERT
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid()) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'))
);

-- Admins and agents can update vehicles
CREATE POLICY "Admins and agents can update vehicles"
ON public.vehicles FOR UPDATE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'))
);

-- Admins can delete vehicles
CREATE POLICY "Admins can delete vehicles"
ON public.vehicles FOR DELETE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) AND
  public.has_role(auth.uid(), 'admin')
);

-- ============================================
-- RLS POLICIES - CLIENTS
-- ============================================
-- Users can view clients in their tenant
CREATE POLICY "Users can view tenant clients"
ON public.clients FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) OR
  public.has_role(auth.uid(), 'superadmin')
);

-- Admins and agents can manage clients
CREATE POLICY "Admins and agents can insert clients"
ON public.clients FOR INSERT
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid()) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'))
);

CREATE POLICY "Admins and agents can update clients"
ON public.clients FOR UPDATE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'))
);

CREATE POLICY "Admins can delete clients"
ON public.clients FOR DELETE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) AND
  public.has_role(auth.uid(), 'admin')
);

-- ============================================
-- RLS POLICIES - CONTRACTS
-- ============================================
-- Users can view contracts in their tenant
CREATE POLICY "Users can view tenant contracts"
ON public.contracts FOR SELECT
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) OR
  public.has_role(auth.uid(), 'superadmin')
);

-- Admins and agents can manage contracts
CREATE POLICY "Admins and agents can insert contracts"
ON public.contracts FOR INSERT
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid()) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'))
);

CREATE POLICY "Admins and agents can update contracts"
ON public.contracts FOR UPDATE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'))
);

CREATE POLICY "Admins can delete contracts"
ON public.contracts FOR DELETE
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) AND
  public.has_role(auth.uid(), 'admin')
);

-- ============================================
-- RLS POLICIES - ASSISTANCE, EXPENSES, INVOICES, PAYMENTS, NOTIFICATIONS
-- ============================================
-- Similar patterns for other tables
CREATE POLICY "Users can view tenant assistance"
ON public.assistance FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can view tenant expenses"
ON public.expenses FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can view tenant invoices"
ON public.invoices FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can view tenant payments"
ON public.payments FOR SELECT
USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

-- Insert/Update/Delete policies for comptable role
CREATE POLICY "Comptables can manage invoices"
ON public.invoices FOR ALL
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'comptable'))
);

CREATE POLICY "Comptables can manage payments"
ON public.payments FOR ALL
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) AND
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'comptable'))
);

-- ============================================
-- TRIGGERS AND FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, tenant_id, nom, email)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'tenant_id')::UUID,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to auto-calculate invoice TTC
CREATE OR REPLACE FUNCTION public.calculate_invoice_ttc()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.montant_ttc := NEW.montant_ht * (1 + NEW.taux_tva / 100);
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_invoice_ttc_trigger
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.calculate_invoice_ttc();

-- Function to update vehicle status when contract status changes
CREATE OR REPLACE FUNCTION public.update_vehicle_status_on_contract_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.statut = 'actif' THEN
    UPDATE public.vehicles SET statut = 'loue' WHERE id = NEW.vehicle_id;
  ELSIF NEW.statut IN ('termine', 'annule') AND OLD.statut = 'actif' THEN
    UPDATE public.vehicles SET statut = 'disponible' WHERE id = NEW.vehicle_id;
    -- Also unlock caution if contract ended
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