-- Corrigir política RLS para permitir cadastro anônimo
-- Remover política atual que pode estar causando conflito
DROP POLICY IF EXISTS "allow_insert_all" ON public.inscricoes_mentoria;

-- Criar nova política que permite INSERT para usuários anônimos e autenticados
CREATE POLICY "allow_public_insert_inscricoes" 
ON public.inscricoes_mentoria
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Garantir que a tabela aceita inserções anônimas
ALTER TABLE public.inscricoes_mentoria ENABLE ROW LEVEL SECURITY;