-- Mettre à jour TOUTES les RLS policies (INSERT, UPDATE, DELETE) pour bloquer l'accès si le tenant est suspendu

-- Table: assistance
DROP POLICY IF EXISTS "Agents can insert assistance in their tenant" ON public.assistance;
CREATE POLICY "Agents can insert assistance in their tenant"
ON public.assistance FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Agents can update their tenant assistance" ON public.assistance;
CREATE POLICY "Agents can update their tenant assistance"
ON public.assistance FOR UPDATE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins can delete their tenant assistance" ON public.assistance;
CREATE POLICY "Admins can delete their tenant assistance"
ON public.assistance FOR DELETE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND has_role(auth.uid(), 'admin'::app_role));

-- Table: clients
DROP POLICY IF EXISTS "Agents can insert clients in their tenant" ON public.clients;
CREATE POLICY "Agents can insert clients in their tenant"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Agents can update their tenant clients" ON public.clients;
CREATE POLICY "Agents can update their tenant clients"
ON public.clients FOR UPDATE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins can delete their tenant clients" ON public.clients;
CREATE POLICY "Admins can delete their tenant clients"
ON public.clients FOR DELETE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND has_role(auth.uid(), 'admin'::app_role));

-- Table: contracts
DROP POLICY IF EXISTS "Agents can insert contracts in their tenant" ON public.contracts;
CREATE POLICY "Agents can insert contracts in their tenant"
ON public.contracts FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Agents can update their tenant contracts" ON public.contracts;
CREATE POLICY "Agents can update their tenant contracts"
ON public.contracts FOR UPDATE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins can delete their tenant contracts" ON public.contracts;
CREATE POLICY "Admins can delete their tenant contracts"
ON public.contracts FOR DELETE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND has_role(auth.uid(), 'admin'::app_role));

-- Table: expenses
DROP POLICY IF EXISTS "Agents can insert expenses in their tenant" ON public.expenses;
CREATE POLICY "Agents can insert expenses in their tenant"
ON public.expenses FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Agents can update expenses in their tenant" ON public.expenses;
CREATE POLICY "Agents can update expenses in their tenant"
ON public.expenses FOR UPDATE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins can delete expenses in their tenant" ON public.expenses;
CREATE POLICY "Admins can delete expenses in their tenant"
ON public.expenses FOR DELETE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND has_role(auth.uid(), 'admin'::app_role));

-- Table: infractions
DROP POLICY IF EXISTS "Agents can insert infractions in their tenant" ON public.infractions;
CREATE POLICY "Agents can insert infractions in their tenant"
ON public.infractions FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Agents can update infractions in their tenant" ON public.infractions;
CREATE POLICY "Agents can update infractions in their tenant"
ON public.infractions FOR UPDATE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins can delete infractions in their tenant" ON public.infractions;
CREATE POLICY "Admins can delete infractions in their tenant"
ON public.infractions FOR DELETE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND has_role(auth.uid(), 'admin'::app_role));

-- Table: sinistres
DROP POLICY IF EXISTS "Agents can insert sinistres in their tenant" ON public.sinistres;
CREATE POLICY "Agents can insert sinistres in their tenant"
ON public.sinistres FOR INSERT
TO authenticated
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Agents can update sinistres in their tenant" ON public.sinistres;
CREATE POLICY "Agents can update sinistres in their tenant"
ON public.sinistres FOR UPDATE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins can delete sinistres in their tenant" ON public.sinistres;
CREATE POLICY "Admins can delete sinistres in their tenant"
ON public.sinistres FOR DELETE
TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true AND has_role(auth.uid(), 'admin'::app_role));