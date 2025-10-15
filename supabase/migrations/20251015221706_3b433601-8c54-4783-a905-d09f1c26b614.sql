-- Créer le bucket pour les logos de l'agence
INSERT INTO storage.buckets (id, name, public)
VALUES ('agency-logos', 'agency-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre à tout le monde de voir les logos
CREATE POLICY "Public Access to Agency Logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'agency-logos');

-- Politique pour permettre aux admins d'uploader des logos
CREATE POLICY "Admins can upload agency logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agency-logos' 
  AND auth.uid() IS NOT NULL
);

-- Politique pour permettre aux admins de mettre à jour les logos
CREATE POLICY "Admins can update agency logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'agency-logos' 
  AND auth.uid() IS NOT NULL
);

-- Politique pour permettre aux admins de supprimer les logos
CREATE POLICY "Admins can delete agency logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'agency-logos' 
  AND auth.uid() IS NOT NULL
);