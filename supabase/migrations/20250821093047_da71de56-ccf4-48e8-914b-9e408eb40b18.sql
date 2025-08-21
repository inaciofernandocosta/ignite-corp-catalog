-- Create RLS policy to allow authenticated users to access certificados storage bucket
CREATE POLICY "Allow authenticated users to access certificados"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'certificados');