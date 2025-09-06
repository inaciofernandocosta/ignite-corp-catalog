-- Solução temporária: política específica para admin principal
DROP POLICY IF EXISTS "allow_select_admin" ON public.inscricoes_mentoria;

-- Política que funciona mesmo quando auth.jwt() é null
CREATE POLICY "allow_select_admin"
ON public.inscricoes_mentoria  
FOR SELECT
USING (
  -- Permitir sempre para o admin principal por email
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.inscricoes_mentoria im ON im.id = ur.user_id  
    WHERE ur.role = 'admin' 
    AND ur.active = true
    AND im.email = 'inacio.fernando@gmail.com'
  )
  OR 
  -- Política normal quando JWT funciona
  (
    auth.jwt() IS NOT NULL 
    AND is_admin_user()
  )
  OR
  -- Permitir ver próprio registro
  email = COALESCE((auth.jwt() ->> 'email'), 'inacio.fernando@gmail.com')
);