-- ============================================
-- STORAGE POLICIES FOR client-documents BUCKET
-- ============================================

-- Policy pour permettre aux agents de voir les fichiers de leur tenant
CREATE POLICY "Agents can view client documents in their tenant"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'client-documents'
  AND (storage.foldername(name))[1] = 'clients'
  AND EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id::text = (storage.foldername(name))[2]
    AND clients.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- Policy pour permettre aux agents d'uploader des fichiers dans leur tenant
CREATE POLICY "Agents can upload client documents in their tenant"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents'
  AND (storage.foldername(name))[1] = 'clients'
  AND EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id::text = (storage.foldername(name))[2]
    AND clients.tenant_id = public.get_user_tenant_id(auth.uid())
  )
  AND (public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'admin'))
);

-- Policy pour permettre aux agents de mettre à jour les fichiers de leur tenant
CREATE POLICY "Agents can update client documents in their tenant"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'client-documents'
  AND (storage.foldername(name))[1] = 'clients'
  AND EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id::text = (storage.foldername(name))[2]
    AND clients.tenant_id = public.get_user_tenant_id(auth.uid())
  )
  AND (public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'admin'))
);

-- Policy pour permettre aux admins de supprimer les fichiers de leur tenant
CREATE POLICY "Admins can delete client documents in their tenant"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'client-documents'
  AND (storage.foldername(name))[1] = 'clients'
  AND EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id::text = (storage.foldername(name))[2]
    AND clients.tenant_id = public.get_user_tenant_id(auth.uid())
  )
  AND public.has_role(auth.uid(), 'admin')
);