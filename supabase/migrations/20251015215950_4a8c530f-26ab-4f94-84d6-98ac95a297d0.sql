DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Authenticated users can view client documents'
  ) THEN
    CREATE POLICY "Authenticated users can view client documents"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'client-documents' AND auth.uid() IS NOT NULL
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
      AND policyname = 'Authenticated users can view assistance PDFs'
  ) THEN
    CREATE POLICY "Authenticated users can view assistance PDFs"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'assistance-pdfs' AND auth.uid() IS NOT NULL
    );
  END IF;
END
$$;