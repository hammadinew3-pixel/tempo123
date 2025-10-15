-- Create storage buckets for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('client-documents', 'client-documents', false),
  ('vehicle-photos', 'vehicle-photos', true),
  ('infraction-files', 'infraction-files', false),
  ('sinistre-files', 'sinistre-files', false),
  ('contract-pdfs', 'contract-pdfs', false),
  ('assistance-pdfs', 'assistance-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for client-documents bucket
CREATE POLICY "Admins can upload client documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can view client documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete client documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for vehicle-photos bucket (public)
CREATE POLICY "Anyone can view vehicle photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Admins can upload vehicle photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-photos' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete vehicle photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vehicle-photos' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for infraction-files bucket
CREATE POLICY "Admins can manage infraction files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'infraction-files' AND
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'infraction-files' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for sinistre-files bucket
CREATE POLICY "Admins can manage sinistre files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'sinistre-files' AND
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'sinistre-files' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for contract-pdfs bucket
CREATE POLICY "Admins can manage contract PDFs"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'contract-pdfs' AND
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'contract-pdfs' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for assistance-pdfs bucket
CREATE POLICY "Admins can manage assistance PDFs"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'assistance-pdfs' AND
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'assistance-pdfs' AND
  has_role(auth.uid(), 'admin'::app_role)
);