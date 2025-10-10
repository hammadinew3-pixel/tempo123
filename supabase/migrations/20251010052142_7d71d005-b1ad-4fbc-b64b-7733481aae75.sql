-- Create role_permissions table to store custom permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(role, permission)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage permissions
CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow all authenticated users to view permissions
CREATE POLICY "Authenticated users can view role permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permissions for agent role
INSERT INTO public.role_permissions (role, permission, enabled) VALUES
  ('agent', 'dashboard.view', true),
  ('agent', 'vehicles.view', true),
  ('agent', 'vehicles.update_km', true),
  ('agent', 'vehicles.update_status', true),
  ('agent', 'vehicles.create', false),
  ('agent', 'vehicles.delete', false),
  ('agent', 'clients.view', true),
  ('agent', 'clients.create', true),
  ('agent', 'clients.update', true),
  ('agent', 'clients.delete', true),
  ('agent', 'contracts.view', true),
  ('agent', 'contracts.create', true),
  ('agent', 'contracts.update', true),
  ('agent', 'contracts.close', true),
  ('agent', 'contracts.delete', true),
  ('agent', 'assistance.view', true),
  ('agent', 'assistance.create', true),
  ('agent', 'assistance.update', true),
  ('agent', 'assistance.delete', false),
  ('agent', 'sinistres.view', true),
  ('agent', 'sinistres.create', true),
  ('agent', 'sinistres.update', true),
  ('agent', 'sinistres.delete', false),
  ('agent', 'infractions.view', true),
  ('agent', 'infractions.create', true),
  ('agent', 'infractions.mark_transmitted', true),
  ('agent', 'infractions.update', false),
  ('agent', 'infractions.delete', false),
  ('agent', 'expenses.view', true),
  ('agent', 'expenses.create', false),
  ('agent', 'expenses.update', false),
  ('agent', 'expenses.delete', false),
  ('agent', 'settings.view', false),
  ('agent', 'settings.update', false),
  ('agent', 'users.view', false),
  ('agent', 'users.manage', false)
ON CONFLICT (role, permission) DO NOTHING;