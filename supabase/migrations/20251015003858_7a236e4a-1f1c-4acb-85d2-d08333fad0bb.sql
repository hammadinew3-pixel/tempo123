-- Create public storage bucket for contract PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-pdfs', 'contract-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to view PDFs
CREATE POLICY "Public can view contract PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'contract-pdfs');

-- Allow authenticated users to upload PDFs (via service role in edge function)
CREATE POLICY "Authenticated users can upload contract PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contract-pdfs' AND auth.role() = 'authenticated');