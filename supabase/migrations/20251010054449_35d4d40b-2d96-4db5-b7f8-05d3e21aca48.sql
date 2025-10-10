-- Supprimer les anciennes politiques de suppression trop permissives
DROP POLICY IF EXISTS "Admins and agents can manage contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admins and agents can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Admins and agents can manage vehicle changes" ON public.vehicle_changes;
DROP POLICY IF EXISTS "Admins and agents can manage secondary drivers" ON public.secondary_drivers;

-- CONTRACTS: Seuls les admins peuvent supprimer
CREATE POLICY "Agents can view contracts"
ON public.contracts
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'agent'::app_role) OR
  public.has_role(auth.uid(), 'comptable'::app_role)
);

CREATE POLICY "Agents can create contracts"
ON public.contracts
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'agent'::app_role)
);

CREATE POLICY "Agents can update contracts"
ON public.contracts
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'agent'::app_role)
);

CREATE POLICY "Only admins can delete contracts"
ON public.contracts
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- CLIENTS: Seuls les admins peuvent supprimer
CREATE POLICY "Agents can view clients"
ON public.clients
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'agent'::app_role) OR
  public.has_role(auth.uid(), 'comptable'::app_role)
);

CREATE POLICY "Agents can create clients"
ON public.clients
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'agent'::app_role)
);

CREATE POLICY "Agents can update clients"
ON public.clients
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'agent'::app_role)
);

CREATE POLICY "Only admins can delete clients"
ON public.clients
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- VEHICLE CHANGES
CREATE POLICY "Users can view vehicle changes"
ON public.vehicle_changes
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'agent'::app_role)
);

CREATE POLICY "Users can create vehicle changes"
ON public.vehicle_changes
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'agent'::app_role)
);

CREATE POLICY "Users can update vehicle changes"
ON public.vehicle_changes
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'agent'::app_role)
);

CREATE POLICY "Only admins can delete vehicle changes"
ON public.vehicle_changes
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- SECONDARY DRIVERS
CREATE POLICY "Users can view secondary drivers"
ON public.secondary_drivers
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'agent'::app_role)
);

CREATE POLICY "Users can create secondary drivers"
ON public.secondary_drivers
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'agent'::app_role)
);

CREATE POLICY "Users can update secondary drivers"
ON public.secondary_drivers
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'agent'::app_role)
);

CREATE POLICY "Only admins can delete secondary drivers"
ON public.secondary_drivers
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));