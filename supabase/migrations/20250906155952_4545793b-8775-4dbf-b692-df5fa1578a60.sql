-- Fix admin policies on inscricoes_mentoria to use is_admin_user() instead of is_admin_check()

DROP POLICY IF EXISTS allow_select_admin ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS allow_update_admin ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS allow_delete_admin ON public.inscricoes_mentoria;

CREATE POLICY "allow_select_admin"
ON public.inscricoes_mentoria
FOR SELECT
USING (is_admin_user());

CREATE POLICY "allow_update_admin"
ON public.inscricoes_mentoria
FOR UPDATE
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "allow_delete_admin"
ON public.inscricoes_mentoria
FOR DELETE
USING (is_admin_user());