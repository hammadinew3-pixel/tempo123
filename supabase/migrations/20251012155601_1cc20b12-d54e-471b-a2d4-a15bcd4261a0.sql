-- Create security definer functions to check permissions from permissions table
CREATE OR REPLACE FUNCTION public.can_view_module(_user_id uuid, _module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.permissions p ON p.role = ur.role
    WHERE ur.user_id = _user_id
      AND p.module = _module
      AND p.can_view = true
  )
$$;

CREATE OR REPLACE FUNCTION public.can_create_module(_user_id uuid, _module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.permissions p ON p.role = ur.role
    WHERE ur.user_id = _user_id
      AND p.module = _module
      AND p.can_create = true
  )
$$;

CREATE OR REPLACE FUNCTION public.can_edit_module(_user_id uuid, _module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.permissions p ON p.role = ur.role
    WHERE ur.user_id = _user_id
      AND p.module = _module
      AND p.can_edit = true
  )
$$;

CREATE OR REPLACE FUNCTION public.can_delete_module(_user_id uuid, _module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.permissions p ON p.role = ur.role
    WHERE ur.user_id = _user_id
      AND p.module = _module
      AND p.can_delete = true
  )
$$;

-- Update vehicles policies to use permissions table
DROP POLICY IF EXISTS "Admins and agents can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update vehicles based on role" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can delete vehicles" ON public.vehicles;

CREATE POLICY "Users can insert vehicles based on permissions"
ON public.vehicles
FOR INSERT
WITH CHECK (public.can_create_module(auth.uid(), 'vehicles'));

CREATE POLICY "Users can update vehicles based on permissions"
ON public.vehicles
FOR UPDATE
USING (public.can_edit_module(auth.uid(), 'vehicles'))
WITH CHECK (public.can_edit_module(auth.uid(), 'vehicles'));

CREATE POLICY "Users can delete vehicles based on permissions"
ON public.vehicles
FOR DELETE
USING (public.can_delete_module(auth.uid(), 'vehicles'));

-- Update clients policies
DROP POLICY IF EXISTS "Agents can create clients" ON public.clients;
DROP POLICY IF EXISTS "Agents can update clients" ON public.clients;
DROP POLICY IF EXISTS "Only admins can delete clients" ON public.clients;

CREATE POLICY "Users can create clients based on permissions"
ON public.clients
FOR INSERT
WITH CHECK (public.can_create_module(auth.uid(), 'clients'));

CREATE POLICY "Users can update clients based on permissions"
ON public.clients
FOR UPDATE
USING (public.can_edit_module(auth.uid(), 'clients'))
WITH CHECK (public.can_edit_module(auth.uid(), 'clients'));

CREATE POLICY "Users can delete clients based on permissions"
ON public.clients
FOR DELETE
USING (public.can_delete_module(auth.uid(), 'clients'));

-- Update contracts policies
DROP POLICY IF EXISTS "Agents can create contracts" ON public.contracts;
DROP POLICY IF EXISTS "Agents can update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Only admins can delete contracts" ON public.contracts;

CREATE POLICY "Users can create contracts based on permissions"
ON public.contracts
FOR INSERT
WITH CHECK (public.can_create_module(auth.uid(), 'contracts'));

CREATE POLICY "Users can update contracts based on permissions"
ON public.contracts
FOR UPDATE
USING (public.can_edit_module(auth.uid(), 'contracts'))
WITH CHECK (public.can_edit_module(auth.uid(), 'contracts'));

CREATE POLICY "Users can delete contracts based on permissions"
ON public.contracts
FOR DELETE
USING (public.can_delete_module(auth.uid(), 'contracts'));

-- Update assistance policies
DROP POLICY IF EXISTS "Agents can insert assistance" ON public.assistance;
DROP POLICY IF EXISTS "Agents can update assistance" ON public.assistance;
DROP POLICY IF EXISTS "Admins can delete assistance" ON public.assistance;

CREATE POLICY "Users can create assistance based on permissions"
ON public.assistance
FOR INSERT
WITH CHECK (public.can_create_module(auth.uid(), 'assistance'));

CREATE POLICY "Users can update assistance based on permissions"
ON public.assistance
FOR UPDATE
USING (public.can_edit_module(auth.uid(), 'assistance'))
WITH CHECK (public.can_edit_module(auth.uid(), 'assistance'));

CREATE POLICY "Users can delete assistance based on permissions"
ON public.assistance
FOR DELETE
USING (public.can_delete_module(auth.uid(), 'assistance'));

-- Update sinistres policies
DROP POLICY IF EXISTS "Agents can insert sinistres" ON public.sinistres;
DROP POLICY IF EXISTS "Agents can update sinistres" ON public.sinistres;
DROP POLICY IF EXISTS "Admins can delete sinistres" ON public.sinistres;

CREATE POLICY "Users can create sinistres based on permissions"
ON public.sinistres
FOR INSERT
WITH CHECK (public.can_create_module(auth.uid(), 'sinistres'));

CREATE POLICY "Users can update sinistres based on permissions"
ON public.sinistres
FOR UPDATE
USING (public.can_edit_module(auth.uid(), 'sinistres'))
WITH CHECK (public.can_edit_module(auth.uid(), 'sinistres'));

CREATE POLICY "Users can delete sinistres based on permissions"
ON public.sinistres
FOR DELETE
USING (public.can_delete_module(auth.uid(), 'sinistres'));

-- Update infractions policies
DROP POLICY IF EXISTS "Agents can insert infractions" ON public.infractions;
DROP POLICY IF EXISTS "Agents can update infractions" ON public.infractions;
DROP POLICY IF EXISTS "Admins can delete infractions" ON public.infractions;

CREATE POLICY "Users can create infractions based on permissions"
ON public.infractions
FOR INSERT
WITH CHECK (public.can_create_module(auth.uid(), 'infractions'));

CREATE POLICY "Users can update infractions based on permissions"
ON public.infractions
FOR UPDATE
USING (public.can_edit_module(auth.uid(), 'infractions'))
WITH CHECK (public.can_edit_module(auth.uid(), 'infractions'));

CREATE POLICY "Users can delete infractions based on permissions"
ON public.infractions
FOR DELETE
USING (public.can_delete_module(auth.uid(), 'infractions'));

-- Update expenses policies
DROP POLICY IF EXISTS "Admins have full access to expenses" ON public.expenses;

CREATE POLICY "Users can create expenses based on permissions"
ON public.expenses
FOR INSERT
WITH CHECK (public.can_create_module(auth.uid(), 'expenses'));

CREATE POLICY "Users can update expenses based on permissions"
ON public.expenses
FOR UPDATE
USING (public.can_edit_module(auth.uid(), 'expenses'))
WITH CHECK (public.can_edit_module(auth.uid(), 'expenses'));

CREATE POLICY "Users can delete expenses based on permissions"
ON public.expenses
FOR DELETE
USING (public.can_delete_module(auth.uid(), 'expenses'));