-- Temporariamente desabilitar triggers de email que podem estar causando erro 500
ALTER TABLE public.inscricoes_mentoria DISABLE TRIGGER trigger_send_admin_notification;
ALTER TABLE public.inscricoes_mentoria DISABLE TRIGGER trigger_send_confirmation_email;