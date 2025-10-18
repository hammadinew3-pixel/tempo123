-- Suppression du module comptabilité
-- Les tables sont supprimées dans l'ordre pour respecter les contraintes de clés étrangères

-- 1. Supprimer acc_entry_lines (dépend de acc_entries et acc_accounts)
DROP TABLE IF EXISTS public.acc_entry_lines CASCADE;

-- 2. Supprimer acc_entries (dépend de acc_journals)
DROP TABLE IF EXISTS public.acc_entries CASCADE;

-- 3. Supprimer acc_tax_settings (dépend de acc_accounts)
DROP TABLE IF EXISTS public.acc_tax_settings CASCADE;

-- 4. Supprimer acc_settings (dépend de acc_accounts)
DROP TABLE IF EXISTS public.acc_settings CASCADE;

-- 5. Supprimer acc_journals
DROP TABLE IF EXISTS public.acc_journals CASCADE;

-- 6. Supprimer acc_accounts
DROP TABLE IF EXISTS public.acc_accounts CASCADE;