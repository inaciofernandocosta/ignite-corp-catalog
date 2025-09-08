-- Corrigir política RLS para inscricoes_cursos permitir inserção anônima
-- Adicionar política que permite INSERT para usuários anônimos ao se inscreverem em cursos
CREATE POLICY "allow_public_insert_course_enrollment" 
ON public.inscricoes_cursos
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);