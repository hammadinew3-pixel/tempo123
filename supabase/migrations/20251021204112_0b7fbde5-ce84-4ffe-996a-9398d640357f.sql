-- Add immatriculation_provisoire column to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS immatriculation_provisoire text;