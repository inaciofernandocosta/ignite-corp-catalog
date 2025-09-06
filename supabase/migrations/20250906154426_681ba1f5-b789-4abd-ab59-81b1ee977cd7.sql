-- Primeiro, remover as políticas que dependem da função is_admin_check
DROP POLICY IF EXISTS allow_select_admin ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS allow_update_admin ON public.inscricoes_mentoria;  
DROP POLICY IF EXISTS allow_delete_admin ON public.inscricoes_mentoria;

-- Agora podemos dropar e recriar a função
DROP FUNCTION IF EXISTS public.is_admin_check();

-- Criar nova versão corrigida da função is_admin_check
CREATE OR REPLACE FUNCTION public.is_admin_check()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.inscricoes_mentoria im ON ur.user_id = im.id
    WHERE im.email = (
      SELECT email 
      FROM auth.users 
      WHERE id = auth.uid()
    )
    AND ur.role = 'admin'
    AND ur.active = true
    AND im.ativo = true
  );
$$;

-- Recriar as políticas com a função corrigida
CREATE POLICY "allow_select_admin" 
ON public.inscricoes_mentoria 
FOR SELECT 
USING (is_admin_check());

CREATE POLICY "allow_update_admin" 
ON public.inscricoes_mentoria 
FOR UPDATE 
USING (is_admin_check()) 
WITH CHECK (is_admin_check());

CREATE POLICY "allow_delete_admin" 
ON public.inscricoes_mentoria 
FOR DELETE 
USING (is_admin_check());