-- Função alternativa para verificação de admin que funciona melhor com RLS
CREATE OR REPLACE FUNCTION public.is_admin_user_safe()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Usar apenas auth.users e user_roles, sem tocar em inscricoes_mentoria
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    WHERE ur.user_id IN (
      SELECT im.id 
      FROM public.inscricoes_mentoria im 
      WHERE im.email = (
        SELECT users.email 
        FROM auth.users 
        WHERE users.id = auth.uid()
      )
      AND im.ativo = TRUE
    )
    AND ur.role = 'admin' 
    AND ur.active = TRUE
  );
$function$

-- Atualizar as políticas RLS para usar a nova função
DROP POLICY IF EXISTS "view_own_or_admin" ON public.inscricoes_mentoria;
CREATE POLICY "view_own_or_admin" ON public.inscricoes_mentoria
FOR SELECT USING (
  is_admin_user_safe() = true OR 
  email = (auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "update_own_or_admin" ON public.inscricoes_mentoria;
CREATE POLICY "update_own_or_admin" ON public.inscricoes_mentoria
FOR UPDATE USING (
  is_admin_user_safe() = true OR 
  email = (auth.jwt() ->> 'email')
) WITH CHECK (
  is_admin_user_safe() = true OR 
  email = (auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "admin_delete_only" ON public.inscricoes_mentoria;
CREATE POLICY "admin_delete_only" ON public.inscricoes_mentoria
FOR DELETE USING (is_admin_user_safe() = true);