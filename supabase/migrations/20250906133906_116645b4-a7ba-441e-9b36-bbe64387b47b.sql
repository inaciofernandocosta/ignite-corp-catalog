-- Criar uma política temporária que permita administradores aprovarem usuários
-- usando verificação de email diretamente (bypass da função is_admin_user que está com problema)

-- Política temporária para UPDATE em inscricoes_mentoria
CREATE POLICY "Admin can update via email check" 
ON public.inscricoes_mentoria 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.inscricoes_mentoria im ON im.id = ur.user_id
    WHERE im.email = 'inacio.fernando@gmail.com'
    AND ur.role = 'admin' 
    AND ur.active = true
    AND im.ativo = true
  )
);

-- Política temporária para UPDATE em inscricoes_cursos
CREATE POLICY "Admin can update courses via email check" 
ON public.inscricoes_cursos 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.inscricoes_mentoria im ON im.id = ur.user_id
    WHERE im.email = 'inacio.fernando@gmail.com'
    AND ur.role = 'admin' 
    AND ur.active = true
    AND im.ativo = true
  )
);