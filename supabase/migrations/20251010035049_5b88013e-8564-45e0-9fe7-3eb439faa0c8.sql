-- Mettre à jour les véhicules qui ont des sinistres ouverts ou en cours
UPDATE public.vehicles v
SET statut = 'immobilise'
WHERE v.id IN (
  SELECT DISTINCT vehicle_id 
  FROM public.sinistres 
  WHERE statut IN ('ouvert', 'en_cours') 
  AND vehicle_id IS NOT NULL
);