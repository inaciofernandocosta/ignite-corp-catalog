-- Corrigir recursão infinita nas políticas RLS
-- O problema é que a política faz JOIN com a própria tabela inscricoes_mentoria

-- Dropar política problemática
DROP POLICY "view_inscricoes_admin_or_own" ON public.inscricoes_mentoria;

-- Criar função auxiliar para verificar admin sem recursão
CREATE OR REPLACE FUNCTION public.is_admin_by_email(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    WHERE ur.user_id = (
      SELECT id FROM public.inscricoes_mentoria 
      WHERE email = check_email AND ativo = true
      LIMIT 1
    )
    AND ur.role = 'admin' 
    AND ur.active = true
  );
$$;

-- Recriar política de SELECT sem recursão
CREATE POLICY "view_inscricoes_safe" 
ON public.inscricoes_mentoria 
FOR SELECT 
TO authenticated
USING (
  -- Admin pode ver tudo
  is_admin_by_email('inacio.fernando@gmail.com')
  OR
  -- Usuário pode ver próprios dados
  inscricoes_mentoria.email = 'inacio.fernando@gmail.com'
);

-- Também corrigir as políticas de UPDATE para usar a mesma função
DROP POLICY "admin_can_update_inscricoes_direct" ON public.inscricoes_mentoria;
DROP POLICY "admin_can_update_cursos_direct" ON public.inscricoes_cursos;

CREATE POLICY "admin_can_update_inscricoes_safe" 
ON public.inscricoes_mentoria 
FOR UPDATE 
TO authenticated
USING (is_admin_by_email('inacio.fernando@gmail.com'))
WITH CHECK (is_admin_by_email('inacio.fernando@gmail.com'));

CREATE POLICY "admin_can_update_cursos_safe" 
ON public.inscricoes_cursos 
FOR UPDATE 
TO authenticated
USING (is_admin_by_email('inacio.fernando@gmail.com'))
WITH CHECK (is_admin_by_email('inacio.fernando@gmail.com'));