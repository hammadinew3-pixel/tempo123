-- Créer la table plans pour les abonnements
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MAD',
  max_vehicles INTEGER NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 0,
  max_clients INTEGER NOT NULL DEFAULT 0,
  max_contracts INTEGER NOT NULL DEFAULT 0,
  module_assistance BOOLEAN NOT NULL DEFAULT false,
  module_sinistres BOOLEAN NOT NULL DEFAULT false,
  module_infractions BOOLEAN NOT NULL DEFAULT false,
  module_alertes BOOLEAN NOT NULL DEFAULT false,
  module_rapports BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins peuvent tout faire
CREATE POLICY "Super admins can view all plans"
  ON public.plans FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert plans"
  ON public.plans FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update plans"
  ON public.plans FOR UPDATE
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete plans"
  ON public.plans FOR DELETE
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- Trigger pour updated_at
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();