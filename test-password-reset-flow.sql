-- TEST PASSWORD RESET FLOW VIA SQL
-- Este script testa o fluxo de reset sem usar a edge function que está falhando

-- 1. Primeiro, vamos limpar tokens antigos para o email de teste
DELETE FROM public.password_reset_tokens 
WHERE email = 'fernando.costa@mentoriafutura.com.br';

-- 2. Criar um token de reset manual para testar
INSERT INTO public.password_reset_tokens (
  email,
  token,
  expires_at,
  used,
  created_at
) VALUES (
  'fernando.costa@mentoriafutura.com.br',
  'test-token-12345678901234567890123456789012', -- Token de teste
  NOW() + INTERVAL '2 hours', -- Expira em 2 horas
  false,
  NOW()
);

-- 3. Verificar se o token foi criado
SELECT 
  email,
  token,
  expires_at,
  used,
  created_at,
  CASE 
    WHEN expires_at > NOW() THEN '✅ Token válido'
    ELSE '❌ Token expirado'
  END as status
FROM public.password_reset_tokens 
WHERE email = 'fernando.costa@mentoriafutura.com.br';

-- 4. Verificar se o usuário existe e está elegível para reset
SELECT 
  im.email,
  im.nome,
  im.status as inscricao_status,
  im.ativo as inscricao_ativa,
  au.id as auth_user_id,
  au.encrypted_password,
  CASE 
    WHEN au.encrypted_password = '$2a$10$defaulthashfortemporarypassword' THEN '⚠️ Senha temporária'
    ELSE '✅ Senha personalizada'
  END as password_status
FROM public.inscricoes_mentoria im
JOIN auth.users au ON au.email = im.email
WHERE im.email = 'fernando.costa@mentoriafutura.com.br';

-- RESULTADO ESPERADO:
-- - Token criado e válido
-- - Usuário existe com status 'aprovado' e ativo = true
-- - Auth user existe (pode ter senha temporária)

-- PRÓXIMO PASSO PARA TESTAR:
-- Usar o token 'test-token-12345678901234567890123456789012' 
-- na URL: https://preview--ignite-corp-catalog.lovable.app/#/resetar-senha?token=test-token-12345678901234567890123456789012
-- E tentar definir uma nova senha