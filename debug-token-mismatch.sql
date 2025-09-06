-- DEBUG TOKEN MISMATCH
-- Comparando o token que o usuário está usando vs o token no banco

-- Token do usuário (dos logs): 47ccda0b6b9ce5e3a8a7e0196c454d9676b5d30d0af952f83dc70dba54262cf1
-- Token no banco: 30de8bd704829a3fb95802e9cc4a860bf30400e7ab3d6a654cd33bbd15ad4d81

-- 1. Verificar se o token dos logs existe no banco
SELECT 
  'Token dos logs' as origem,
  token,
  user_email,
  expires_at,
  used,
  created_at,
  CASE 
    WHEN expires_at > NOW() THEN '✅ Válido'
    ELSE '❌ Expirado'
  END as status
FROM public.password_reset_tokens 
WHERE token = '47ccda0b6b9ce5e3a8a7e0196c454d9676b5d30d0af952f83dc70dba54262cf1'

UNION ALL

-- 2. Verificar o token válido no banco
SELECT 
  'Token no banco' as origem,
  token,
  user_email,
  expires_at,
  used,
  created_at,
  CASE 
    WHEN expires_at > NOW() THEN '✅ Válido'
    ELSE '❌ Expirado'
  END as status
FROM public.password_reset_tokens 
WHERE token = '30de8bd704829a3fb95802e9cc4a860bf30400e7ab3d6a654cd33bbd15ad4d81'

ORDER BY created_at DESC;

-- 3. Listar todos os tokens para fernando.costa@mentoriafutura.com.br
SELECT 
  token,
  expires_at,
  used,
  created_at,
  CASE 
    WHEN expires_at > NOW() AND used = false THEN '✅ Válido para uso'
    WHEN expires_at <= NOW() THEN '❌ Expirado'
    WHEN used = true THEN '❌ Já usado'
    ELSE '❌ Status desconhecido'
  END as status
FROM public.password_reset_tokens 
WHERE user_email = 'fernando.costa@mentoriafutura.com.br'
ORDER BY created_at DESC
LIMIT 10;

-- POSSÍVEIS CAUSAS:
-- 1. Usuário está usando um link antigo/expirado
-- 2. Há algum cache no navegador
-- 3. O email enviou um token diferente do que foi salvo
-- 4. Erro na extração do token da URL no frontend