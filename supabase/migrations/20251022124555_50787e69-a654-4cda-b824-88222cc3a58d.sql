-- Fonction pour calculer automatiquement le montant d'un abonnement
CREATE OR REPLACE FUNCTION calculate_subscription_amount()
RETURNS TRIGGER AS $$
DECLARE
  plan_price numeric;
BEGIN
  -- Récupérer le prix approprié selon la durée
  IF NEW.duration = 6 THEN
    SELECT price_6_months INTO plan_price
    FROM plans
    WHERE id = NEW.plan_id;
  ELSIF NEW.duration = 12 THEN
    SELECT price_12_months INTO plan_price
    FROM plans
    WHERE id = NEW.plan_id;
  ELSE
    -- Pour les autres durées, calculer au prorata du prix mensuel
    SELECT price * NEW.duration INTO plan_price
    FROM plans
    WHERE id = NEW.plan_id;
  END IF;

  -- Assigner le montant calculé
  NEW.amount = COALESCE(plan_price, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour calculer automatiquement le montant lors de l'insertion ou mise à jour
DROP TRIGGER IF EXISTS calculate_subscription_amount_trigger ON subscriptions;
CREATE TRIGGER calculate_subscription_amount_trigger
  BEFORE INSERT OR UPDATE OF plan_id, duration
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_subscription_amount();

-- Mettre à jour les montants existants pour tous les abonnements
UPDATE subscriptions s
SET amount = CASE
  WHEN s.duration = 6 THEN p.price_6_months
  WHEN s.duration = 12 THEN p.price_12_months
  ELSE p.price * s.duration
END
FROM plans p
WHERE s.plan_id = p.id AND s.amount = 0;