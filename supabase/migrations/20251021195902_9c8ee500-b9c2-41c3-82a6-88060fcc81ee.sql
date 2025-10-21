-- Create RLS policies for vehicle-photos bucket to allow uploads
-- Policy to allow authenticated users to insert (upload) photos
CREATE POLICY "Authenticated users can upload vehicle photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-photos');

-- Policy to allow authenticated users to update their photos
CREATE POLICY "Authenticated users can update vehicle photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicle-photos');

-- Policy to allow authenticated users to delete their photos
CREATE POLICY "Authenticated users can delete vehicle photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-photos');

-- Policy to allow public read access (since bucket is public)
CREATE POLICY "Public can view vehicle photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'vehicle-photos');