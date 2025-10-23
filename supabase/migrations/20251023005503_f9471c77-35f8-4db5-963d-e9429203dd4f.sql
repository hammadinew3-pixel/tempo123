-- Migration pour sécuriser le bucket client-documents
-- Cette migration rend le bucket privé et ajoute les RLS policies appropriées

-- 1. Rendre le bucket client-documents privé
UPDATE storage.buckets
SET public = false
WHERE id = 'client-documents';

-- 2. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "tenant_read" ON storage.objects;
DROP POLICY IF EXISTS "tenant_delete" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload client documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own tenant client documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own tenant client documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own tenant client documents" ON storage.objects;

-- 3. Policy pour permettre aux utilisateurs authentifiés d'uploader des documents clients
CREATE POLICY "Users can upload client documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-documents' AND
  auth.uid() IS NOT NULL
);

-- 4. Policy pour permettre aux utilisateurs de lire les documents de leur tenant
CREATE POLICY "Users can read own tenant client documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-documents' AND
  auth.uid() IS NOT NULL AND
  -- Vérifier que le client appartient au même tenant que l'utilisateur
  EXISTS (
    SELECT 1 
    FROM public.clients c
    WHERE 
      -- Extraire l'ID du client depuis le path (format: clients/{client_id}/...)
      c.id::text = (string_to_array(name, '/'))[2] AND
      c.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- 5. Policy pour permettre aux utilisateurs de supprimer les documents de leur tenant
CREATE POLICY "Users can delete own tenant client documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-documents' AND
  auth.uid() IS NOT NULL AND
  -- Vérifier que le client appartient au même tenant que l'utilisateur
  EXISTS (
    SELECT 1 
    FROM public.clients c
    WHERE 
      -- Extraire l'ID du client depuis le path (format: clients/{client_id}/...)
      c.id::text = (string_to_array(name, '/'))[2] AND
      c.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- 6. Policy pour permettre la mise à jour des documents
CREATE POLICY "Users can update own tenant client documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client-documents' AND
  auth.uid() IS NOT NULL AND
  -- Vérifier que le client appartient au même tenant que l'utilisateur
  EXISTS (
    SELECT 1 
    FROM public.clients c
    WHERE 
      -- Extraire l'ID du client depuis le path (format: clients/{client_id}/...)
      c.id::text = (string_to_array(name, '/'))[2] AND
      c.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);