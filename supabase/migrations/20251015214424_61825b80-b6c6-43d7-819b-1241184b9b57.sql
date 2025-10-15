-- Mettre à jour le statut des véhicules dont tous les contrats sont terminés ou retournés
UPDATE vehicles v
SET 
  statut = 'disponible',
  updated_at = NOW()
WHERE 
  v.statut = 'loue'
  AND NOT EXISTS (
    SELECT 1 
    FROM contracts c 
    WHERE c.vehicle_id = v.id 
    AND c.statut IN ('brouillon', 'ouvert', 'contrat_valide', 'livre')
  );