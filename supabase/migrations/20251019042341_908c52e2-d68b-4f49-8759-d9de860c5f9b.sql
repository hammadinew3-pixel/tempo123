-- Permettre aux super-admins de voir toutes les données de tous les tenants

-- Vehicles
CREATE POLICY "Super admins can view all vehicles"
ON public.vehicles FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Clients
CREATE POLICY "Super admins can view all clients"
ON public.clients FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Contracts
CREATE POLICY "Super admins can view all contracts"
ON public.contracts FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Assistance
CREATE POLICY "Super admins can view all assistance"
ON public.assistance FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Expenses
CREATE POLICY "Super admins can view all expenses"
ON public.expenses FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Infractions
CREATE POLICY "Super admins can view all infractions"
ON public.infractions FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Sinistres
CREATE POLICY "Super admins can view all sinistres"
ON public.sinistres FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Revenus
CREATE POLICY "Super admins can view all revenus"
ON public.revenus FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Cheques
CREATE POLICY "Super admins can view all cheques"
ON public.cheques FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Interventions
CREATE POLICY "Super admins can view all interventions"
ON public.interventions FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Assurances
CREATE POLICY "Super admins can view all assurances"
ON public.assurances FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));