-- Create security definer function to check user roles without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
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

-- Drop existing policies on user_roles that cause recursion
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update other tables' policies to use the function
DROP POLICY IF EXISTS "Admins and agents can manage clients" ON public.clients;
CREATE POLICY "Admins and agents can manage clients"
ON public.clients
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'agent')
);

DROP POLICY IF EXISTS "Admins and agents can manage contracts" ON public.contracts;
CREATE POLICY "Admins and agents can manage contracts"
ON public.contracts
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'agent')
);

DROP POLICY IF EXISTS "Admins can manage expenses" ON public.expenses;
CREATE POLICY "Admins can manage expenses"
ON public.expenses
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Comptables and admins can manage invoices" ON public.invoices;
CREATE POLICY "Comptables and admins can manage invoices"
ON public.invoices
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'comptable')
);

DROP POLICY IF EXISTS "Comptables and admins can manage payments" ON public.payments;
CREATE POLICY "Comptables and admins can manage payments"
ON public.payments
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'comptable')
);

DROP POLICY IF EXISTS "Admins and agents can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins and agents can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can delete vehicles" ON public.vehicles;

CREATE POLICY "Admins and agents can insert vehicles"
ON public.vehicles
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'agent')
);

CREATE POLICY "Admins and agents can update vehicles"
ON public.vehicles
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'agent')
);

CREATE POLICY "Admins can delete vehicles"
ON public.vehicles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));