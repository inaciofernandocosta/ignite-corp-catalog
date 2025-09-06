-- Simplificar políticas RLS para evitar conflitos
DROP POLICY IF EXISTS "allow_select_admin" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "allow_select_own" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "allow_update_admin" ON public.inscricoes_mentoria; 
DROP POLICY IF EXISTS "allow_update_own" ON public.inscricoes_mentoria;

-- Política simples: permitir SELECT quando há usuário autenticado
CREATE POLICY "authenticated_users_can_read"
ON public.inscricoes_mentoria
FOR SELECT
TO authenticated
USING (true);

-- Política de UPDATE: apenas para o próprio email ou admins específicos  
CREATE POLICY "users_can_update_own_or_admin"
ON public.inscricoes_mentoria
FOR UPDATE
TO authenticated
USING (
  -- Próprio usuário
  email = (auth.jwt() ->> 'email')
  OR
  -- Admin específico
  (auth.jwt() ->> 'email') = 'inacio.fernando@gmail.com'
)
WITH CHECK (
  -- Próprio usuário
  email = (auth.jwt() ->> 'email')
  OR
  -- Admin específico
  (auth.jwt() ->> 'email') = 'inacio.fernando@gmail.com'
);