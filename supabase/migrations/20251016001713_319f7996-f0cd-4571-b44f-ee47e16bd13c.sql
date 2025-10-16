-- Link infractions to clients, vehicles, contracts and files; link sinistres similarly
-- Add foreign keys safely (idempotent) and create indexes for performance

-- 1) Infractions foreign keys
DO $$
BEGIN
  -- client_id -> clients(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_infractions_client_id'
  ) THEN
    ALTER TABLE public.infractions
      ADD CONSTRAINT fk_infractions_client_id
      FOREIGN KEY (client_id)
      REFERENCES public.clients(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
  BEGIN
    ALTER TABLE public.infractions VALIDATE CONSTRAINT fk_infractions_client_id;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Validation skipped for fk_infractions_client_id: %', SQLERRM;
  END;

  -- vehicle_id -> vehicles(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_infractions_vehicle_id'
  ) THEN
    ALTER TABLE public.infractions
      ADD CONSTRAINT fk_infractions_vehicle_id
      FOREIGN KEY (vehicle_id)
      REFERENCES public.vehicles(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
  BEGIN
    ALTER TABLE public.infractions VALIDATE CONSTRAINT fk_infractions_vehicle_id;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Validation skipped for fk_infractions_vehicle_id: %', SQLERRM;
  END;

  -- contract_id -> contracts(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_infractions_contract_id'
  ) THEN
    ALTER TABLE public.infractions
      ADD CONSTRAINT fk_infractions_contract_id
      FOREIGN KEY (contract_id)
      REFERENCES public.contracts(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
  BEGIN
    ALTER TABLE public.infractions VALIDATE CONSTRAINT fk_infractions_contract_id;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Validation skipped for fk_infractions_contract_id: %', SQLERRM;
  END;
END $$;

-- Indexes for infractions
CREATE INDEX IF NOT EXISTS idx_infractions_client_id ON public.infractions(client_id);
CREATE INDEX IF NOT EXISTS idx_infractions_vehicle_id ON public.infractions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_infractions_contract_id ON public.infractions(contract_id);

-- 2) infraction_files -> infractions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_infraction_files_infraction_id'
  ) THEN
    ALTER TABLE public.infraction_files
      ADD CONSTRAINT fk_infraction_files_infraction_id
      FOREIGN KEY (infraction_id)
      REFERENCES public.infractions(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
  BEGIN
    ALTER TABLE public.infraction_files VALIDATE CONSTRAINT fk_infraction_files_infraction_id;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Validation skipped for fk_infraction_files_infraction_id: %', SQLERRM;
  END;
END $$;

CREATE INDEX IF NOT EXISTS idx_infraction_files_infraction_id ON public.infraction_files(infraction_id);

-- 3) Sinistres foreign keys
DO $$
BEGIN
  -- client_id -> clients(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_sinistres_client_id'
  ) THEN
    ALTER TABLE public.sinistres
      ADD CONSTRAINT fk_sinistres_client_id
      FOREIGN KEY (client_id)
      REFERENCES public.clients(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
  BEGIN
    ALTER TABLE public.sinistres VALIDATE CONSTRAINT fk_sinistres_client_id;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Validation skipped for fk_sinistres_client_id: %', SQLERRM;
  END;

  -- vehicle_id -> vehicles(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_sinistres_vehicle_id'
  ) THEN
    ALTER TABLE public.sinistres
      ADD CONSTRAINT fk_sinistres_vehicle_id
      FOREIGN KEY (vehicle_id)
      REFERENCES public.vehicles(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
  BEGIN
    ALTER TABLE public.sinistres VALIDATE CONSTRAINT fk_sinistres_vehicle_id;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Validation skipped for fk_sinistres_vehicle_id: %', SQLERRM;
  END;

  -- contract_id -> contracts(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_sinistres_contract_id'
  ) THEN
    ALTER TABLE public.sinistres
      ADD CONSTRAINT fk_sinistres_contract_id
      FOREIGN KEY (contract_id)
      REFERENCES public.contracts(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
  BEGIN
    ALTER TABLE public.sinistres VALIDATE CONSTRAINT fk_sinistres_contract_id;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Validation skipped for fk_sinistres_contract_id: %', SQLERRM;
  END;
END $$;

-- Indexes for sinistres
CREATE INDEX IF NOT EXISTS idx_sinistres_client_id ON public.sinistres(client_id);
CREATE INDEX IF NOT EXISTS idx_sinistres_vehicle_id ON public.sinistres(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sinistres_contract_id ON public.sinistres(contract_id);

-- 4) sinistre_files -> sinistres
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_sinistre_files_sinistre_id'
  ) THEN
    ALTER TABLE public.sinistre_files
      ADD CONSTRAINT fk_sinistre_files_sinistre_id
      FOREIGN KEY (sinistre_id)
      REFERENCES public.sinistres(id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
  BEGIN
    ALTER TABLE public.sinistre_files VALIDATE CONSTRAINT fk_sinistre_files_sinistre_id;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Validation skipped for fk_sinistre_files_sinistre_id: %', SQLERRM;
  END;
END $$;

CREATE INDEX IF NOT EXISTS idx_sinistre_files_sinistre_id ON public.sinistre_files(sinistre_id);