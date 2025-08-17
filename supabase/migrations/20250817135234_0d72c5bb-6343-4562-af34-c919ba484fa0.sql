-- Primeiro, mapear os status existentes para os novos valores
UPDATE public.inscricoes_cursos 
SET status = CASE 
  WHEN status = 'ativo' THEN 'aprovado'
  WHEN status = 'concluido' THEN 'concluido'
  WHEN status = 'pendente' THEN 'pendente'
  ELSE 'pendente'
END;

-- Remover qualquer constraint existente
ALTER TABLE public.inscricoes_cursos 
DROP CONSTRAINT IF EXISTS inscricoes_cursos_status_check;

-- Aplicar a nova constraint
ALTER TABLE public.inscricoes_cursos 
ADD CONSTRAINT inscricoes_cursos_status_check 
CHECK (status IN ('pendente', 'aprovado', 'reprovado', 'concluido'));