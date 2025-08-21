-- Tornar o bucket certificados público para resolver erro 400
UPDATE storage.buckets 
SET public = true 
WHERE id = 'certificados';