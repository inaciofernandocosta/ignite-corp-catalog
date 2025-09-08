-- Permitir que usuários anônimos possam ler dados necessários após inserção
-- Modificar política de SELECT para incluir usuários anônimos
DROP POLICY IF EXISTS "authenticated_users_can_read" ON public.inscricoes_mentoria;

CREATE POLICY "allow_read_for_all_users" 
ON public.inscricoes_mentoria
FOR SELECT 
TO anon, authenticated
USING (true);