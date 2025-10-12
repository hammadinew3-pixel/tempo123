-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for client documents
CREATE POLICY "Client documents are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'client-documents');

CREATE POLICY "Authenticated users can upload client documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update client documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'client-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete client documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'client-documents' 
  AND auth.role() = 'authenticated'
);