-- Supprimer les politiques basées sur les permissions
DROP POLICY IF EXISTS "Users can insert vehicles based on permissions" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update vehicles based on permissions" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete vehicles based on permissions" ON public.vehicles;
DROP POLICY IF EXISTS "Users can create clients based on permissions" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients based on permissions" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients based on permissions" ON public.clients;
DROP POLICY IF EXISTS "Users can create contracts based on permissions" ON public.contracts;
DROP POLICY IF EXISTS "Users can update contracts based on permissions" ON public.contracts;
DROP POLICY IF EXISTS "Users can delete contracts based on permissions" ON public.contracts;
DROP POLICY IF EXISTS "Users can create assistance based on permissions" ON public.assistance;
DROP POLICY IF EXISTS "Users can update assistance based on permissions" ON public.assistance;
DROP POLICY IF EXISTS "Users can delete assistance based on permissions" ON public.assistance;
DROP POLICY IF EXISTS "Users can create sinistres based on permissions" ON public.sinistres;
DROP POLICY IF EXISTS "Users can update sinistres based on permissions" ON public.sinistres;
DROP POLICY IF EXISTS "Users can delete sinistres based on permissions" ON public.sinistres;
DROP POLICY IF EXISTS "Users can create infractions based on permissions" ON public.infractions;
DROP POLICY IF EXISTS "Users can update infractions based on permissions" ON public.infractions;
DROP POLICY IF EXISTS "Users can delete infractions based on permissions" ON public.infractions;
DROP POLICY IF EXISTS "Users can create expenses based on permissions" ON public.expenses;
DROP POLICY IF EXISTS "Users can update expenses based on permissions" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete expenses based on permissions" ON public.expenses;

-- Supprimer les fonctions de vérification des permissions
DROP FUNCTION IF EXISTS public.can_view_module(_user_id uuid, _module text);
DROP FUNCTION IF EXISTS public.can_create_module(_user_id uuid, _module text);
DROP FUNCTION IF EXISTS public.can_edit_module(_user_id uuid, _module text);
DROP FUNCTION IF EXISTS public.can_delete_module(_user_id uuid, _module text);

-- Supprimer la table permissions
DROP TABLE IF EXISTS public.permissions CASCADE;

-- Recréer les politiques simples (admin uniquement)
CREATE POLICY "Admins can manage vehicles"
ON public.vehicles
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage clients"
ON public.clients
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage contracts"
ON public.contracts
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage assistance"
ON public.assistance
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage sinistres"
ON public.sinistres
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage infractions"
ON public.infractions
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage expenses"
ON public.expenses
FOR ALL
USING (has_role(auth.uid(), 'admin'));