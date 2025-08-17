
-- Cria o gatilho para enviar e-mail de inscrição recebida
-- quando houver uma nova inscrição em cursos

-- Remove o gatilho anterior, se existir, para evitar duplicidade
DROP TRIGGER IF EXISTS trg_send_enrollment_confirmation ON public.inscricoes_cursos;

-- Cria o gatilho AFTER INSERT para chamar a função que invoca a edge function
CREATE TRIGGER trg_send_enrollment_confirmation
AFTER INSERT ON public.inscricoes_cursos
FOR EACH ROW
EXECUTE FUNCTION public.send_course_enrollment_confirmation();
