-- Create storage bucket for agency logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('agency-logos', 'agency-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for agency logos
CREATE POLICY "Public can view agency logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'agency-logos');

CREATE POLICY "Admins can upload agency logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agency-logos' 
  AND (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can update agency logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'agency-logos'
  AND (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can delete agency logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'agency-logos'
  AND (SELECT has_role(auth.uid(), 'admin'::app_role))
);