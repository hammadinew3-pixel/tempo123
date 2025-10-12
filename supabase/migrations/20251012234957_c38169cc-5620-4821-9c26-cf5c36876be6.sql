-- Corriger les échéances existantes en marquant les premières comme payées
-- selon le champ duree_deja_paye de chaque traite

DO $$
DECLARE
  traite_record RECORD;
  echeance_record RECORD;
  counter INTEGER;
BEGIN
  -- Pour chaque traite avec des mois déjà payés
  FOR traite_record IN 
    SELECT id, duree_deja_paye 
    FROM public.vehicules_traite 
    WHERE duree_deja_paye > 0
  LOOP
    counter := 0;
    
    -- Marquer les premières échéances comme payées
    FOR echeance_record IN
      SELECT id, date_echeance
      FROM public.vehicules_traites_echeances
      WHERE traite_id = traite_record.id
      ORDER BY date_echeance ASC
      LIMIT traite_record.duree_deja_paye
    LOOP
      counter := counter + 1;
      
      UPDATE public.vehicules_traites_echeances
      SET 
        statut = 'Payée',
        date_paiement = echeance_record.date_echeance,
        notes = 'Mois déjà payé (' || counter || '/' || traite_record.duree_deja_paye || ')'
      WHERE id = echeance_record.id;
    END LOOP;
  END LOOP;
END $$;