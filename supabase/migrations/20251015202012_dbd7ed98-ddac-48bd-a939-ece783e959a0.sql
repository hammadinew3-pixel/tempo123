-- Insert default vehicle assistance categories
INSERT INTO public.vehicle_assistance_categories (code, nom, label, description, ordre, actif) VALUES
  ('A', 'Catégorie A', 'Catégorie A', 'Petites citadines économiques', 1, true),
  ('B', 'Catégorie B', 'Catégorie B', 'Citadines compactes', 2, true),
  ('C', 'Catégorie C', 'Catégorie C', 'Berlines moyennes', 3, true),
  ('D', 'Catégorie D', 'Catégorie D', 'Berlines familiales', 4, true),
  ('E', 'Catégorie E', 'Catégorie E', 'Berlines haut de gamme', 5, true),
  ('F', 'Catégorie F', 'Catégorie F', 'SUV et 4x4', 6, true),
  ('G', 'Catégorie G', 'Catégorie G', 'Monospaces', 7, true),
  ('H', 'Catégorie H', 'Catégorie H', 'Utilitaires', 8, true)
ON CONFLICT (code) DO NOTHING;