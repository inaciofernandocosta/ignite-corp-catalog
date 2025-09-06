-- Vamos simplificar a função admin para usar apenas auth.uid()
-- sem depender de auth.users.email que pode estar causando problemas

DROP FUNCTION IF EXISTS public.is_current_user_admin();

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.inscricoes_mentoria im ON im.id = ur.user_id
    JOIN auth.users au ON au.email = im.email
    WHERE au.id = auth.uid()
    AND ur.role = 'admin' 
    AND ur.active = true
    AND im.ativo = true
  );
$$;