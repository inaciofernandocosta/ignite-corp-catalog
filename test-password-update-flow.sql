-- TEST PASSWORD UPDATE FLOW VIA SQL
-- Este script testa o fluxo de atualização de senha diretamente

-- 1. Verificar se existe o token específico que o usuário está tentando usar
SELECT 
  token,
  user_email,
  expires_at,
  used,
  created_at,
  CASE 
    WHEN expires_at > NOW() THEN '✅ Token válido'
    ELSE '❌ Token expirado'
  END as token_status
FROM public.password_reset_tokens 
WHERE token = '47ccda0b6b9ce5e3a8a7e0196c454d9676b5d30d0af952f83dc70dba54262cf1'
ORDER BY created_at DESC;

-- 2. Verificar se o usuário existe na tabela inscricoes_mentoria
SELECT 
  im.email,
  im.nome,
  im.status as inscricao_status,
  im.ativo as inscricao_ativa,
  COUNT(prt.id) as tokens_ativos
FROM public.inscricoes_mentoria im
LEFT JOIN public.password_reset_tokens prt ON prt.user_email = im.email AND prt.used = false
WHERE im.email IN (
  SELECT user_email FROM public.password_reset_tokens 
  WHERE token = '47ccda0b6b9ce5e3a8a7e0196c454d9676b5d30d0af952f83dc70dba54262cf1'
)
GROUP BY im.email, im.nome, im.status, im.ativo;

-- 3. Verificar se o usuário existe em auth.users (usando a view que funciona)
SELECT 
  uer.email,
  uer.user_id,
  uer.can_reset_password,
  uer.inscricao_status,
  uer.inscricao_ativa
FROM public.users_eligible_for_reset uer
WHERE uer.email IN (
  SELECT user_email FROM public.password_reset_tokens 
  WHERE token = '47ccda0b6b9ce5e3a8a7e0196c454d9676b5d30d0af952f83dc70dba54262cf1'
);

-- 4. Teste de atualização de senha simulado (SEM EXECUTAR)
-- Este é apenas um exemplo do que a função deveria fazer:
/*
-- Buscar o auth user_id baseado no email do token
WITH token_data AS (
  SELECT user_email 
  FROM public.password_reset_tokens 
  WHERE token = '47ccda0b6b9ce5e3a8a7e0196c454d9676b5d30d0af952f83dc70dba54262cf1'
  AND used = false 
  AND expires_at > NOW()
),
auth_user AS (
  SELECT uer.user_id, uer.email
  FROM public.users_eligible_for_reset uer
  JOIN token_data td ON td.user_email = uer.email
  WHERE uer.can_reset_password = true
)
SELECT 
  au.user_id as auth_user_id,
  au.email,
  'Usuário encontrado para atualização' as status
FROM auth_user au;
*/

-- 5. Verificar estrutura da tabela auth.users (se possível)
-- NOTA: Esta query pode falhar devido a permissões
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users' 
AND column_name IN ('id', 'email', 'encrypted_password', 'updated_at')
ORDER BY ordinal_position;

-- DIAGNÓSTICO ESPERADO:
-- 1. Token deve existir e estar válido
-- 2. Usuário deve existir em inscricoes_mentoria com status aprovado
-- 3. Usuário deve existir em auth.users
-- 4. Deve ser possível encontrar o user_id para atualização