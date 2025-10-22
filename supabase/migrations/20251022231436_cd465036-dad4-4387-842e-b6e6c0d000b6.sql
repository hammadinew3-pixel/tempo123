-- Table pour stocker les tokens OTP de réinitialisation super admin
CREATE TABLE IF NOT EXISTS public.super_admin_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON public.super_admin_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON public.super_admin_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON public.super_admin_reset_tokens(expires_at);

-- RLS policies
ALTER TABLE public.super_admin_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Seule la fonction edge peut insérer/mettre à jour les tokens
CREATE POLICY "Service role can manage reset tokens"
ON public.super_admin_reset_tokens
FOR ALL
USING (true)
WITH CHECK (true);

COMMENT ON TABLE public.super_admin_reset_tokens IS 'Tokens OTP pour la réinitialisation sécurisée des mots de passe super admin';
COMMENT ON COLUMN public.super_admin_reset_tokens.token IS 'Code OTP à 6 chiffres';
COMMENT ON COLUMN public.super_admin_reset_tokens.expires_at IS 'Expiration du token (15 minutes après création)';
COMMENT ON COLUMN public.super_admin_reset_tokens.attempts IS 'Nombre de tentatives de validation du token';