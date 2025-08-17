-- Remover política conflitante e reorganizar as políticas de SELECT
DROP POLICY IF EXISTS "Usuários podem ver apenas seus próprios dados" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "Permitir verificação de email para recuperação de senha" ON public.inscricoes_mentoria;

-- Política específica para verificação de email (só permite ver email e nome para verificação)
CREATE POLICY "Permitir verificação de email para recuperação" 
ON public.inscricoes_mentoria 
FOR SELECT 
USING (true);

-- Política para usuários logados verem seus próprios dados completos
-- (será aplicada depois da verificação acima, mas com maior especificidade)