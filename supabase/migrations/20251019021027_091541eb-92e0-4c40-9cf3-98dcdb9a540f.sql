-- Partie 1: Ajouter le rôle super_admin à l'enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_admin';