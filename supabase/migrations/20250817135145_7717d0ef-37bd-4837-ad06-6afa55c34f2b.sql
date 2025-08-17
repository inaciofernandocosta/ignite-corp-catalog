-- Primeiro, vamos verificar e corrigir qualquer status inválido
UPDATE public.inscricoes_cursos 
SET status = 'pendente' 
WHERE status NOT IN ('pendente', 'aprovado', 'reprovado', 'concluido');

-- Agora aplicar a constraint atualizada
ALTER TABLE public.inscricoes_cursos 
DROP CONSTRAINT IF EXISTS inscricoes_cursos_status_check;

ALTER TABLE public.inscricoes_cursos 
ADD CONSTRAINT inscricoes_cursos_status_check 
CHECK (status IN ('pendente', 'aprovado', 'reprovado', 'concluido'));