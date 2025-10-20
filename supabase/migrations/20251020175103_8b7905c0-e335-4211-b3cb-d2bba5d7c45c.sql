-- Add pricing columns for 6 and 12 months plans with discount
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS price_6_months numeric(10,2),
ADD COLUMN IF NOT EXISTS price_12_months numeric(10,2),
ADD COLUMN IF NOT EXISTS discount_percent numeric(5,2) DEFAULT 0;

-- Add comment to explain the columns
COMMENT ON COLUMN public.plans.price_6_months IS 'Prix HT pour 6 mois';
COMMENT ON COLUMN public.plans.price_12_months IS 'Prix HT pour 12 mois';
COMMENT ON COLUMN public.plans.discount_percent IS 'Remise en pourcentage appliquée sur le total du plan';