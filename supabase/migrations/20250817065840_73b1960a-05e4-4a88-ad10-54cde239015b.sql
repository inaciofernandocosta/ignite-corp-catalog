-- Permitir verificação de existência de email para recuperação de senha
-- Usuários não logados precisam poder verificar se um email existe
CREATE POLICY "Permitir verificação de email para recuperação de senha" 
ON public.inscricoes_mentoria 
FOR SELECT 
USING (true);