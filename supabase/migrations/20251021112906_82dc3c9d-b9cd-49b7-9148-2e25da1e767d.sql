-- Créer le bucket pour les documents des véhicules
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents_vehicules', 'documents_vehicules', false);

-- Politique pour permettre aux utilisateurs de voir leurs documents
CREATE POLICY "Users can view their tenant vehicle documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents_vehicules' 
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.vehicles WHERE tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- Politique pour permettre aux agents/admins d'uploader des documents
CREATE POLICY "Agents can upload vehicle documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents_vehicules'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.vehicles WHERE tenant_id = public.get_user_tenant_id(auth.uid())
  )
  AND (
    public.has_role(auth.uid(), 'agent'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Politique pour permettre aux agents/admins de supprimer des documents
CREATE POLICY "Agents can delete vehicle documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents_vehicules'
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.vehicles WHERE tenant_id = public.get_user_tenant_id(auth.uid())
  )
  AND (
    public.has_role(auth.uid(), 'agent'::app_role) OR 
    public.has_role(auth.uid(), 'admin'::app_role)
  )
);