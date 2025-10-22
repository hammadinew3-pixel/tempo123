-- Politiques RLS pour le bucket client-documents (ordres de mission, CIN, permis)

-- Politique pour permettre aux agents et admins d'uploader des fichiers
CREATE POLICY "Agents can upload to client-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-documents' 
  AND (
    has_role(auth.uid(), 'agent'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Politique pour permettre aux agents et admins de mettre à jour des fichiers
CREATE POLICY "Agents can update client-documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client-documents' 
  AND (
    has_role(auth.uid(), 'agent'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Politique pour permettre aux agents et admins de supprimer des fichiers
CREATE POLICY "Agents can delete client-documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-documents' 
  AND (
    has_role(auth.uid(), 'agent'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Politique pour permettre à tous les utilisateurs authentifiés de lire les fichiers
CREATE POLICY "Authenticated users can read client-documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'client-documents');