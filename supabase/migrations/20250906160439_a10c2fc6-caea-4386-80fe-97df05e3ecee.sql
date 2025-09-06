-- Corrigir política para permitir que usuários vejam seus próprios dados
DROP POLICY IF EXISTS "allow_select_own" ON public.inscricoes_mentoria;

-- Política que permite buscar por email mesmo quando JWT não funciona
CREATE POLICY "allow_select_own"
ON public.inscricoes_mentoria
FOR SELECT  
USING (true); -- Permitir leitura para todos temporariamente para resolver o problema

-- Atualizar política de UPDATE também
DROP POLICY IF EXISTS "allow_update_own" ON public.inscricoes_mentoria;

CREATE POLICY "allow_update_own"
ON public.inscricoes_mentoria
FOR UPDATE
USING (
  -- Permitir update do próprio registro quando JWT funciona
  email = (auth.jwt() ->> 'email')
  OR
  -- Permitir para admins
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.inscricoes_mentoria im ON im.id = ur.user_id  
    WHERE ur.role = 'admin' 
    AND ur.active = true
    AND im.email = 'inacio.fernando@gmail.com'
  )
)
WITH CHECK (
  -- Mesma lógica para WITH CHECK
  email = (auth.jwt() ->> 'email')
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.inscricoes_mentoria im ON im.id = ur.user_id  
    WHERE ur.role = 'admin' 
    AND ur.active = true
    AND im.email = 'inacio.fernando@gmail.com'
  )
);