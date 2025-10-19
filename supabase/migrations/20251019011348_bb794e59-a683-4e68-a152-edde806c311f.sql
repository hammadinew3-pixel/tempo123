-- Supprimer le trigger en double qui crée les dépenses deux fois
DROP TRIGGER IF EXISTS trigger_create_expense_for_intervention ON public.interventions;

-- Garder uniquement le trigger create_expense_on_intervention_insert qui est plus spécifique
-- (il vérifie que depense_id IS NULL avant de créer une dépense)