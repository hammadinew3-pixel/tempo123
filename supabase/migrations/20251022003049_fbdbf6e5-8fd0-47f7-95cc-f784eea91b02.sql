-- Créer le bucket pour les factures de location
INSERT INTO storage.buckets (id, name, public)
VALUES ('location-pdfs', 'location-pdfs', false);

-- Politique pour permettre aux utilisateurs d'insérer leurs propres factures
CREATE POLICY "Users can upload their own location invoices"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'location-pdfs' 
  AND auth.uid() IS NOT NULL
);

-- Politique pour permettre aux utilisateurs de lire leurs propres factures
CREATE POLICY "Users can read their own location invoices"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'location-pdfs' 
  AND auth.uid() IS NOT NULL
);