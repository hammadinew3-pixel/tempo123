-- Update RLS policies for agent permissions (simplified)

-- Vehicles: agents can view and update
DROP POLICY IF EXISTS "Admins and agents can update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can fully update vehicles" ON vehicles;
DROP POLICY IF EXISTS "Agents can update vehicle km and status" ON vehicles;

CREATE POLICY "Admins can update vehicles"
ON vehicles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can update vehicles"
ON vehicles
FOR UPDATE
USING (has_role(auth.uid(), 'agent'::app_role));

-- Assistance: agents can create and update but not delete
DROP POLICY IF EXISTS "Admins and agents can insert assistance" ON assistance;
DROP POLICY IF EXISTS "Admins and agents can update assistance" ON assistance;
DROP POLICY IF EXISTS "Admins can manage assistance" ON assistance;
DROP POLICY IF EXISTS "Agents can view assistance" ON assistance;
DROP POLICY IF EXISTS "Agents can create assistance" ON assistance;
DROP POLICY IF EXISTS "Agents can update assistance" ON assistance;

CREATE POLICY "Admins have full access to assistance"
ON assistance
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view assistance"
ON assistance
FOR SELECT
USING (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can insert assistance"
ON assistance
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can update assistance"
ON assistance
FOR UPDATE
USING (has_role(auth.uid(), 'agent'::app_role));

-- Sinistres: agents can create, update and view but not delete
DROP POLICY IF EXISTS "Admins and agents can insert sinistres" ON sinistres;
DROP POLICY IF EXISTS "Admins and agents can update sinistres" ON sinistres;
DROP POLICY IF EXISTS "Admins can manage sinistres" ON sinistres;
DROP POLICY IF EXISTS "Agents can view sinistres" ON sinistres;
DROP POLICY IF EXISTS "Agents can create sinistres" ON sinistres;
DROP POLICY IF EXISTS "Agents can update sinistres" ON sinistres;

CREATE POLICY "Admins have full access to sinistres"
ON sinistres
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view sinistres"
ON sinistres
FOR SELECT
USING (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can insert sinistres"
ON sinistres
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can update sinistres"
ON sinistres
FOR UPDATE
USING (has_role(auth.uid(), 'agent'::app_role));

-- Infractions: agents can create and update
DROP POLICY IF EXISTS "Admins and agents can insert infractions" ON infractions;
DROP POLICY IF EXISTS "Admins and agents can update infractions" ON infractions;
DROP POLICY IF EXISTS "Admins can manage infractions" ON infractions;
DROP POLICY IF EXISTS "Agents can view infractions" ON infractions;
DROP POLICY IF EXISTS "Agents can create infractions" ON infractions;
DROP POLICY IF EXISTS "Agents can update infraction status" ON infractions;

CREATE POLICY "Admins have full access to infractions"
ON infractions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view infractions"
ON infractions
FOR SELECT
USING (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can insert infractions"
ON infractions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Agents can update infractions"
ON infractions
FOR UPDATE
USING (has_role(auth.uid(), 'agent'::app_role));

-- Expenses: agents can only view
DROP POLICY IF EXISTS "Admins and agents can manage expenses" ON expenses;
DROP POLICY IF EXISTS "Admins can manage expenses" ON expenses;
DROP POLICY IF EXISTS "Agents can view expenses" ON expenses;

CREATE POLICY "Admins have full access to expenses"
ON expenses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view expenses"
ON expenses
FOR SELECT
USING (has_role(auth.uid(), 'agent'::app_role));