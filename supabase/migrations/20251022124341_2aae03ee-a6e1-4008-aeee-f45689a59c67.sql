-- Add amount column to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS amount numeric DEFAULT 0;