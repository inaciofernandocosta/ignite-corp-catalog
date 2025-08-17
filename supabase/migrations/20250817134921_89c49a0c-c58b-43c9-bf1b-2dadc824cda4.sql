-- Primeiro, vamos verificar os status atuais e atualizar os dados existentes
UPDATE public.inscricoes_cursos 
SET status = 'pendente' 
WHERE status = 'ativo';

-- Agora podemos remover a constraint antiga e adicionar a nova
ALTER TABLE public.inscricoes_cursos 
DROP CONSTRAINT IF EXISTS inscricoes_cursos_status_check;

ALTER TABLE public.inscricoes_cursos 
ADD CONSTRAINT inscricoes_cursos_status_check 
CHECK (status IN ('pendente', 'aprovado', 'reprovado'));

-- Atualizar o valor padrão também
ALTER TABLE public.inscricoes_cursos 
ALTER COLUMN status SET DEFAULT 'pendente';