-- Create super_admin_settings table
CREATE TABLE IF NOT EXISTS public.super_admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name TEXT DEFAULT 'CRSApp',
  support_email TEXT,
  maintenance_mode BOOLEAN DEFAULT false,
  default_max_vehicles INTEGER DEFAULT 50,
  default_max_users INTEGER DEFAULT 10,
  trial_duration_days INTEGER DEFAULT 30,
  enable_email_alerts BOOLEAN DEFAULT true,
  log_retention_days INTEGER DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default singleton record
INSERT INTO public.super_admin_settings (id, platform_name, support_email) 
VALUES ('00000000-0000-0000-0000-000000000001', 'CRSApp Console', 'support@crsapp.com')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.super_admin_settings ENABLE ROW LEVEL SECURITY;

-- Super admins can view settings
CREATE POLICY "Super admins can view settings"
  ON public.super_admin_settings FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- Super admins can update settings
CREATE POLICY "Super admins can update settings"
  ON public.super_admin_settings FOR UPDATE
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_super_admin_settings_updated_at
  BEFORE UPDATE ON public.super_admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();