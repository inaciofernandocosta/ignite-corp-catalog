-- Dropar política atual de INSERT
DROP POLICY IF EXISTS "public_can_insert" ON public.inscricoes_mentoria;

-- Criar política super simples para INSERT que sempre permite
CREATE POLICY "allow_anonymous_insert" ON public.inscricoes_mentoria
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Garantir que anon pode inserir
GRANT INSERT ON public.inscricoes_mentoria TO anon;