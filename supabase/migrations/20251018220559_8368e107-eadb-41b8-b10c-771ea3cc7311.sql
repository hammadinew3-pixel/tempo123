-- Remove default
ALTER TABLE user_roles ALTER COLUMN role DROP DEFAULT;

-- Drop has_role function with CASCADE
DROP FUNCTION IF EXISTS has_role(uuid, app_role) CASCADE;

-- Rename old enum
ALTER TYPE app_role RENAME TO app_role_old;

-- Create new enum with admin and agent
CREATE TYPE app_role AS ENUM ('admin', 'agent');

-- Update user_roles table
ALTER TABLE user_roles 
  ALTER COLUMN role TYPE app_role 
  USING (CASE 
    WHEN role::text = 'admin' THEN 'admin'::app_role 
    ELSE 'agent'::app_role 
  END);

-- Drop old enum
DROP TYPE app_role_old;

-- Recreate has_role function
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

-- Set default
ALTER TABLE user_roles ALTER COLUMN role SET DEFAULT 'agent'::app_role;