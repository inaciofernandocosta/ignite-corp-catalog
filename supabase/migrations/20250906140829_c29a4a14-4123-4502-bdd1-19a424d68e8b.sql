-- O problema é o trigger que usa gen_random_bytes - vamos corrigir
-- Primeiro, desabilitar triggers problemáticos temporariamente

-- Desabilitar trigger que causa problema
ALTER TABLE public.inscricoes_mentoria DISABLE TRIGGER trigger_auto_create_auth_account_v2;

-- Habilitar extensão pgcrypto se não existir (para gen_random_bytes)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Reabilitar trigger 
ALTER TABLE public.inscricoes_mentoria ENABLE TRIGGER trigger_auto_create_auth_account_v2;

-- Agora testar novamente a função admin
SELECT public.admin_update_user_status(
  '90b6824f-7966-4df0-9cbb-f10800838d86'::uuid,
  'aprovado'
);