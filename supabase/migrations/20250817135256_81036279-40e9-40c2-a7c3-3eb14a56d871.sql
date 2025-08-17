-- Primeiro, remover completamente qualquer constraint de status
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints 
               WHERE constraint_name = 'inscricoes_cursos_status_check') THEN
        ALTER TABLE public.inscricoes_cursos DROP CONSTRAINT inscricoes_cursos_status_check;
    END IF;
END $$;

-- Verificar e normalizar os dados
UPDATE public.inscricoes_cursos 
SET status = 'aprovado' 
WHERE status = 'ativo';

-- Agora adicionar a constraint com todos os status permitidos
ALTER TABLE public.inscricoes_cursos 
ADD CONSTRAINT inscricoes_cursos_status_check 
CHECK (status IN ('pendente', 'aprovado', 'reprovado', 'concluido'));