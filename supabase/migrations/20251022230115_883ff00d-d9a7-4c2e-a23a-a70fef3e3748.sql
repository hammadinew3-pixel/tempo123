-- Add onboarding_step column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 1;

-- Add comment to explain the column
COMMENT ON COLUMN tenants.onboarding_step IS 'Current step in the onboarding workflow (1-4). Used to resume onboarding if user quits before completion.';