-- Create storage bucket for vehicle documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-documents', 'vehicle-documents', true);

-- Add photo_url columns to document tables
ALTER TABLE public.vehicle_insurance
ADD COLUMN photo_url TEXT;

ALTER TABLE public.vehicle_technical_inspection
ADD COLUMN photo_url TEXT;

ALTER TABLE public.vehicle_vignette
ADD COLUMN photo_url TEXT;

-- Create RLS policies for storage
CREATE POLICY "Authenticated users can view vehicle documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload vehicle documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vehicle-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update vehicle documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vehicle-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete vehicle documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'vehicle-documents' AND auth.role() = 'authenticated');