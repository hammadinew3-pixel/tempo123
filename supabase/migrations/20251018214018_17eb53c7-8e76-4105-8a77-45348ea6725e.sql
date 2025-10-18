-- Fonction pour créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nom, actif)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', NEW.email),
    true
  );
  RETURN NEW;
END;
$$;

-- Trigger pour appeler la fonction à chaque nouvel utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Synchroniser les utilisateurs existants qui n'ont pas de profil
INSERT INTO public.profiles (id, email, nom, actif)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'nom', u.email),
  true
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);