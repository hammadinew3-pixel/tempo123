-- Check and list all foreign key constraints on infractions/sinistres tables
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== Foreign Keys on infractions table ===';
  FOR rec IN
    SELECT conname, conrelid::regclass AS table_name, 
           confrelid::regclass AS referenced_table,
           a.attname AS column_name,
           af.attname AS referenced_column
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
    WHERE c.contype = 'f' 
      AND conrelid = 'public.infractions'::regclass
    ORDER BY conname
  LOOP
    RAISE NOTICE 'Constraint: %, Column: % -> %.%', 
      rec.conname, rec.column_name, rec.referenced_table, rec.referenced_column;
  END LOOP;

  RAISE NOTICE '=== Foreign Keys on sinistres table ===';
  FOR rec IN
    SELECT conname, conrelid::regclass AS table_name, 
           confrelid::regclass AS referenced_table,
           a.attname AS column_name,
           af.attname AS referenced_column
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
    WHERE c.contype = 'f' 
      AND conrelid = 'public.sinistres'::regclass
    ORDER BY conname
  LOOP
    RAISE NOTICE 'Constraint: %, Column: % -> %.%', 
      rec.conname, rec.column_name, rec.referenced_table, rec.referenced_column;
  END LOOP;
END $$;

-- Drop duplicate/problematic constraints and keep only the named ones
DO $$
BEGIN
  -- For infractions table - keep only fk_infractions_* constraints
  PERFORM conname FROM pg_constraint 
  WHERE conrelid = 'public.infractions'::regclass 
    AND contype = 'f' 
    AND conname NOT LIKE 'fk_infractions_%'
    AND conname LIKE 'infractions_%';
  
  IF FOUND THEN
    EXECUTE 'ALTER TABLE public.infractions DROP CONSTRAINT IF EXISTS infractions_client_id_fkey CASCADE';
    EXECUTE 'ALTER TABLE public.infractions DROP CONSTRAINT IF EXISTS infractions_vehicle_id_fkey CASCADE';
    EXECUTE 'ALTER TABLE public.infractions DROP CONSTRAINT IF EXISTS infractions_contract_id_fkey CASCADE';
    RAISE NOTICE 'Dropped old infractions foreign keys';
  END IF;

  -- For sinistres table - keep only fk_sinistres_* constraints  
  PERFORM conname FROM pg_constraint 
  WHERE conrelid = 'public.sinistres'::regclass 
    AND contype = 'f' 
    AND conname NOT LIKE 'fk_sinistres_%'
    AND conname LIKE 'sinistres_%';
  
  IF FOUND THEN
    EXECUTE 'ALTER TABLE public.sinistres DROP CONSTRAINT IF EXISTS sinistres_client_id_fkey CASCADE';
    EXECUTE 'ALTER TABLE public.sinistres DROP CONSTRAINT IF EXISTS sinistres_vehicle_id_fkey CASCADE';
    EXECUTE 'ALTER TABLE public.sinistres DROP CONSTRAINT IF EXISTS sinistres_contract_id_fkey CASCADE';
    RAISE NOTICE 'Dropped old sinistres foreign keys';
  END IF;

  -- For files tables
  EXECUTE 'ALTER TABLE public.infraction_files DROP CONSTRAINT IF EXISTS infraction_files_infraction_id_fkey CASCADE';
  EXECUTE 'ALTER TABLE public.sinistre_files DROP CONSTRAINT IF EXISTS sinistre_files_sinistre_id_fkey CASCADE';
  RAISE NOTICE 'Dropped old file foreign keys';
END $$;