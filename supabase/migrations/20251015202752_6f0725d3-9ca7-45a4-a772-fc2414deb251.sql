-- Fix database functions with immutable search_path
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
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_infraction_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
BEGIN
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(description FROM '\d+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM infractions
  WHERE description LIKE 'INF-' || year_suffix || '-%';
  
  RETURN 'INF-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_sinistre_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
BEGIN
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM '\d+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM sinistres
  WHERE reference LIKE 'SIN-' || year_suffix || '-%';
  
  RETURN 'SIN-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$;