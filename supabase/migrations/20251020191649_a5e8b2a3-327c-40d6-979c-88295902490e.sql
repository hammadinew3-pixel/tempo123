-- Add separate discount columns for 6 months and 12 months
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS discount_6_months numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_12_months numeric(5,2) DEFAULT 0;

-- Update existing plans to use the new discount columns if discount_percent exists
UPDATE public.plans
SET discount_6_months = COALESCE(discount_percent, 0),
    discount_12_months = COALESCE(discount_percent, 0)
WHERE discount_6_months IS NULL OR discount_12_months IS NULL;