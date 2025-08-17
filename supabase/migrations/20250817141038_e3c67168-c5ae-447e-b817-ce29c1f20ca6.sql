-- Encontrei o problema: há múltiplos triggers na tabela inscricoes_cursos
-- causando envio de e-mails duplicados

-- Primeiro, vamos remover todos os triggers existentes relacionados ao envio de e-mail
DROP TRIGGER IF EXISTS send_enrollment_confirmation_trigger ON public.inscricoes_cursos;
DROP TRIGGER IF EXISTS trg_send_enrollment_confirmation ON public.inscricoes_cursos;

-- Remover também as funções antigas duplicadas se existirem
DROP FUNCTION IF EXISTS public.send_course_enrollment_confirmation();

-- Manter apenas o trigger mais recente que criamos
-- (send_course_enrollment_confirmation_trigger já existe e está funcionando)