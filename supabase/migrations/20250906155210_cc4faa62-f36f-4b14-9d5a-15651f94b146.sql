
-- 1) inscricoes_mentoria: corrigir policies "own" para usar o email do JWT

DROP POLICY IF EXISTS allow_select_own ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS allow_update_own ON public.inscricoes_mentoria;

CREATE POLICY "allow_select_own"
ON public.inscricoes_mentoria
FOR SELECT
USING (
  email = (auth.jwt() ->> 'email')
);

CREATE POLICY "allow_update_own"
ON public.inscricoes_mentoria
FOR UPDATE
USING (
  email = (auth.jwt() ->> 'email')
)
WITH CHECK (
  email = (auth.jwt() ->> 'email')
);

-- 2) progresso_aulas: corrigir policy para usar email do JWT (remove subselect em auth.users)
DROP POLICY IF EXISTS "Alunos veem seu próprio progresso" ON public.progresso_aulas;

CREATE POLICY "Alunos veem seu próprio progresso"
ON public.progresso_aulas
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.inscricoes_cursos ic
    JOIN public.inscricoes_mentoria im ON im.id = ic.aluno_id
    WHERE ic.id = progresso_aulas.inscricao_curso_id
      AND im.email = (auth.jwt() ->> 'email')
      AND im.ativo = true
  )
);
