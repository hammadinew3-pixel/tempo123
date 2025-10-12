-- Supprimer le trigger qui génère automatiquement les échéances
-- car nous les générons maintenant dans le code avec la logique des mois déjà payés
DROP TRIGGER IF EXISTS generate_traite_echeances_trigger ON public.vehicules_traite;