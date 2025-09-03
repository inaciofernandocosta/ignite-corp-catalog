-- Corrigir a função is_admin_user para fazer a ligação correta
CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS(
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.inscricoes_mentoria im ON im.id = ur.user_id
    WHERE im.email = (
      SELECT users.email 
      FROM auth.users 
      WHERE users.id = auth.uid()
    )
    AND ur.role = 'admin' 
    AND ur.active = true
    AND im.ativo = true
  );
$function$