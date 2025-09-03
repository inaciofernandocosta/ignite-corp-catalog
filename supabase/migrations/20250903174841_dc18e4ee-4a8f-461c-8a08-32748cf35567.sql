-- Reabilitar trigger de email de confirmação
ALTER TABLE public.inscricoes_mentoria ENABLE TRIGGER trigger_send_confirmation_email;