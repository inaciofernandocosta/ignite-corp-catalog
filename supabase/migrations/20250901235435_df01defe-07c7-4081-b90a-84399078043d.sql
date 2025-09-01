-- Add RLS policy to allow authenticated users to read their own inscricoes_mentoria
CREATE POLICY "Authenticated users can view their own inscricao" 
ON public.inscricoes_mentoria 
FOR SELECT 
TO authenticated
USING (
  email = (auth.jwt() ->> 'email') AND ativo = true
);