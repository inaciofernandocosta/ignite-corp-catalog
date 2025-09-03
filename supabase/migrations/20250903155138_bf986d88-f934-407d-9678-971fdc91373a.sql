-- Desabilitar temporariamente todos os triggers que podem causar erro 500
ALTER TABLE public.inscricoes_mentoria DISABLE TRIGGER trigger_auto_create_auth;
ALTER TABLE public.inscricoes_mentoria DISABLE TRIGGER trigger_auto_create_auth_account;
ALTER TABLE public.inscricoes_mentoria DISABLE TRIGGER trigger_create_user_role;
ALTER TABLE public.inscricoes_mentoria DISABLE TRIGGER trigger_send_approval_email;
ALTER TABLE public.inscricoes_mentoria DISABLE TRIGGER trigger_atualizar_vagas_ocupadas;