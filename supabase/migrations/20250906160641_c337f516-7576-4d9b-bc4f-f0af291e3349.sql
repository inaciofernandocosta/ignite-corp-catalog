-- Reverter políticas para funcionarem corretamente
DROP POLICY IF EXISTS "allow_select_admin" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "allow_select_own" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "allow_update_admin" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "allow_update_own" ON public.inscricoes_mentoria;

-- Política que permite acesso do usuário ao próprio perfil
CREATE POLICY "allow_select_own"
ON public.inscricoes_mentoria
FOR SELECT
USING (
  -- Permite acesso por email (para busca de perfil)
  email = COALESCE((auth.jwt() ->> 'email'), email)
);

-- Política que permite acesso de admin a todos os registros
CREATE POLICY "allow_select_admin"
ON public.inscricoes_mentoria  
FOR SELECT
USING (
  -- Admin específico por email (solução temporária)
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.email = 'inacio.fernando@gmail.com'
    AND au.id = auth.uid()
  )
  OR
  -- Admin via user_roles quando JWT funciona
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.inscricoes_mentoria im ON im.id = ur.user_id
      WHERE ur.role = 'admin' 
      AND ur.active = true
      AND im.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  )
);

-- Política de UPDATE para próprio usuário
CREATE POLICY "allow_update_own"
ON public.inscricoes_mentoria
FOR UPDATE
USING (
  email = (auth.jwt() ->> 'email')
)
WITH CHECK (
  email = (auth.jwt() ->> 'email')
);

-- Política de UPDATE para admin
CREATE POLICY "allow_update_admin"
ON public.inscricoes_mentoria
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.email = 'inacio.fernando@gmail.com'
    AND au.id = auth.uid()
  )
  OR
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.inscricoes_mentoria im ON im.id = ur.user_id
      WHERE ur.role = 'admin' 
      AND ur.active = true
      AND im.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.email = 'inacio.fernando@gmail.com'
    AND au.id = auth.uid()
  )
  OR
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.inscricoes_mentoria im ON im.id = ur.user_id
      WHERE ur.role = 'admin' 
      AND ur.active = true
      AND im.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  )
);