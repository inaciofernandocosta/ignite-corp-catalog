-- Atualizar a constraint para incluir o status "concluido"
ALTER TABLE public.inscricoes_cursos 
DROP CONSTRAINT IF EXISTS inscricoes_cursos_status_check;

ALTER TABLE public.inscricoes_cursos 
ADD CONSTRAINT inscricoes_cursos_status_check 
CHECK (status IN ('pendente', 'aprovado', 'reprovado', 'concluido'));