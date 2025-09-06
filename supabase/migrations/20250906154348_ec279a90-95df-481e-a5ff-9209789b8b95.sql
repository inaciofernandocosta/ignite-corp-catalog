-- Corrigir a função is_admin_check que está causando erro 403
DROP FUNCTION IF EXISTS public.is_admin_check();

-- Criar versão corrigida da função is_admin_check
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