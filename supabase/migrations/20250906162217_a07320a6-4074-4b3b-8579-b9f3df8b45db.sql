-- Restaurar funcionalidade de administração de alunos
-- Parte 1: Ajustar inscricoes_mentoria para permitir admin UPDATE

-- Remover política de update atual
DROP POLICY IF EXISTS "users_can_update_own_or_admin" ON public.inscricoes_mentoria;

-- Criar políticas separadas e mais claras
CREATE POLICY "users_can_update_own" 
ON public.inscricoes_mentoria
FOR UPDATE 
TO authenticated
USING (email = (auth.jwt() ->> 'email'))
WITH CHECK (email = (auth.jwt() ->> 'email'));

CREATE POLICY "admins_can_update_all"
ON public.inscricoes_mentoria  
FOR UPDATE
TO authenticated
USING (
  is_admin_user() OR 
  (auth.jwt() ->> 'email') = 'inacio.fernando@gmail.com'
)
WITH CHECK (
  is_admin_user() OR 
  (auth.jwt() ->> 'email') = 'inacio.fernando@gmail.com'
);

-- Parte 2: Ajustar inscricoes_cursos para permitir admin SELECT e UPDATE

-- Adicionar política SELECT para admin ver todas as inscrições
CREATE POLICY "admins_can_view_all_enrollments"
ON public.inscricoes_cursos
FOR SELECT
TO authenticated  
USING (
  is_admin_user() OR 
  (auth.jwt() ->> 'email') = 'inacio.fernando@gmail.com'
);

-- Substituir política UPDATE atual por uma mais segura
DROP POLICY IF EXISTS "admin_can_update_cursos_safe" ON public.inscricoes_cursos;

CREATE POLICY "admins_can_update_cursos"
ON public.inscricoes_cursos
FOR UPDATE
TO authenticated
USING (
  is_admin_user() OR 
  (auth.jwt() ->> 'email') = 'inacio.fernando@gmail.com'  
)
WITH CHECK (
  is_admin_user() OR 
  (auth.jwt() ->> 'email') = 'inacio.fernando@gmail.com'
);