-- Add RLS policy to allow authenticated users to select their own inscricoes_mentoria records
-- This will prevent 406 errors when users try to fetch their profile data

CREATE POLICY "Authenticated users can view their own inscricao"
ON public.inscricoes_mentoria
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' = email
  AND ativo = true
);