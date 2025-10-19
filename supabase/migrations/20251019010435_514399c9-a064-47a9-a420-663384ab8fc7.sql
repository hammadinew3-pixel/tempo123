-- Mettre à jour les CGV du premier tenant (le plus ancien) avec les CGV standard
UPDATE public.tenant_settings
SET 
  cgv_texte = 'Article 1: ETAT DU VÉHICULE

Le véhicule est délivré au locataire en parfait état de marche. Ce véhicule sera rendu dans le même état qu''à son départ. A défaut, le client devra acquitter le montant de remise en état. Les cinq pneus sont au départ en bon état, en cas de détérioration de l''un d''entre eux pour une cause autre que l''usure normale, ou de disparition de l''un d''entre eux, le client s''engage à le remplacer immédiatement par un pneu de même dimension, de la même marque et d''usure sensiblement égale.

Article 2: ENTRETIEN ET RÉPARATION

L''usure mécanique normale est à la charge du loueur. Toutes les réparations provenant soit d''une usure anormale, soit d''une négligence de la part du client soit une cause accidentelle seront à la charge du client, leur montant sera augmenté d''indemnité d''immobilisation.

Article 3: UTILISATION DU VÉHICULE

La location est personnelle et n''est en aucun cas transmissible. Le client s''engage à ne pas laisser conduire la voiture par d''autres personnes que celles figurant sur le contrat.

Article 4: ASSURANCE ET ACCIDENTS

Le client est assuré suivant les conditions générales des polices d''assurances qui sont contractées par le loueur qu''il déclare bien connaître:

A) Les accidents causés aux tiers sans limitation.

B) Les dégâts causés à la voiture sont supportés en totalité par le client s''il est fautif. Si ce dernier n''est pas fautif, il doit payer une franchise selon la catégorie du véhicule.

Le client devra déclarer au loueur dans les plus brefs délais, tout accident, vol ou incendie, sa déclaration devra mentionner les circonstances exactes, notamment le lieu de l''accident, la date, l''heure, les témoins (avec à l''appui le constat d''un agent de la police, ou de la gendarmerie).

C) Le client peut accepter ou refuser l''assurance des personnes transportées aux conditions des tarifs en vigueur, En aucun cas le nombre de personnes transportées dans la voiture ne devra excéder celui indiqué sur la police d''assurance du véhicule sous peine de voir la seule responsabilité du client.

Article 5: RÈGLEMENT DE LA LOCATION - PROLONGATION - RETOUR DU VÉHICULE

Les montants de location et de versement du pré-paiement sont déterminés par les tarifs en vigueur et payables d''avances. Le versement ne pourra servir en aucun cas à une prolongation de location. Afin d''éviter toutes contestation et pour le cas où le client voudrait conserver la voiture pour un temps supérieur à celui indiqué sur le contrat de location, il devrait, après avoir obtenu l''accord du loueur,  faire parvenir le montant de la période supplémentaire avant l''expiration de la location en cours sous peine de s''exposer  des poursuites judiciaire pour détournement de véhicule et abus de confiance.

Article 6: DOCUMENT DE LA VOITURE

Le client remettra au loueur, dès retour de la voiture, tous les titres de circulation afférents à cette dernière, faute de quoi, la location continuera de lui être facturée au prix initial jusqu''à production d''un certificat de perte et règlement des frais de duplicata.

Article 7: RESPONSABILITES

Le client demeure seul responsable des amendes, contraventions, procès-verbaux et poursuites douanières établis contre lui.',
  inclure_cgv = true,
  updated_at = now()
WHERE id = (
  SELECT id 
  FROM public.tenant_settings 
  ORDER BY created_at ASC 
  LIMIT 1
);