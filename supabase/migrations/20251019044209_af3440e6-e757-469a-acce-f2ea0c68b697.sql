-- Permettre à la fonction create-user d'insérer des profils
-- via une politique pour les insertions système
CREATE POLICY "Service role can insert profiles"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);