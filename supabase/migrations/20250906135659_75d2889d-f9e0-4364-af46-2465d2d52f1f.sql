-- Identificado o problema: auth.jwt() ->> 'email' retorna null
-- Solução: Atualizar políticas RLS para usar auth.uid() em vez de email

-- Primeiro, vamos dropar as políticas problemáticas e recriar usando auth.uid()

-- Dropar políticas antigas de UPDATE que usam email
DROP POLICY "update_own_or_admin" ON public.inscricoes_mentoria;
DROP POLICY "Admin can update via email check" ON public.inscricoes_mentoria;
DROP POLICY "Administradores podem gerenciar inscrições" ON public.inscricoes_cursos;
DROP POLICY "Admin can update courses via email check" ON public.inscricoes_cursos;

-- Criar função auxiliar para verificar se usuário é admin usando auth.uid()
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN auth.users au ON au.email IN (
      SELECT email FROM public.inscricoes_mentoria 
      WHERE id = ur.user_id AND ativo = true
    )
    WHERE au.id = auth.uid()
    AND ur.role = 'admin' 
    AND ur.active = true
  );
$$;

-- Recriar políticas de UPDATE usando a nova função
CREATE POLICY "admin_can_update_inscricoes" 
ON public.inscricoes_mentoria 
FOR UPDATE 
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "admin_can_update_cursos" 
ON public.inscricoes_cursos 
FOR UPDATE 
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Também vamos corrigir a política de SELECT que usa email
DROP POLICY "view_own_or_admin" ON public.inscricoes_mentoria;

CREATE POLICY "view_own_or_admin_fixed" 
ON public.inscricoes_mentoria 
FOR SELECT 
TO authenticated
USING (
  is_current_user_admin() OR 
  EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = auth.uid() 
    AND au.email = inscricoes_mentoria.email
  )
);