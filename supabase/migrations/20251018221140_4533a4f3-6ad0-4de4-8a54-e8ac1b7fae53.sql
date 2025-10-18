-- Add policy to allow agents to create clients
CREATE POLICY "Agents can insert clients" ON clients 
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'agent'));