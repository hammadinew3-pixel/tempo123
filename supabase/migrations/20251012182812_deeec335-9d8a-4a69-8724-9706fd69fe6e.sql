-- Add new file types to infraction_file_type enum
ALTER TYPE infraction_file_type ADD VALUE IF NOT EXISTS 'cin';
ALTER TYPE infraction_file_type ADD VALUE IF NOT EXISTS 'permis';
ALTER TYPE infraction_file_type ADD VALUE IF NOT EXISTS 'contrat';