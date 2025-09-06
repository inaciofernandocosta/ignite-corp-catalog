-- TESTE DE VALIDAÇÃO DE TOKEN
-- Use este SQL para gerar o link correto para teste

-- 1. Buscar o token válido atual
SELECT 
  concat(
    'https://preview--ignite-corp-catalog.lovable.app/#/resetar-senha?token=',
    token
  ) as link_correto,
  user_email,
  expires_at,
  CASE 
    WHEN expires_at > NOW() THEN '✅ Link válido até ' || expires_at::text
    ELSE '❌ Link expirado'
  END as status_link
FROM public.password_reset_tokens 
WHERE user_email = 'fernando.costa@mentoriafutura.com.br'
AND used = false
AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 1;

-- 2. Se não houver token válido, você pode gerar um novo pedindo reset novamente
-- ou usar este token específico que está no banco para teste:
-- Token no banco: 30de8bd704829a3fb95802e9cc4a860bf30400e7ab3d6a654cd33bbd15ad4d81
-- Link correto: https://preview--ignite-corp-catalog.lovable.app/#/resetar-senha?token=30de8bd704829a3fb95802e9cc4a860bf30400e7ab3d6a654cd33bbd15ad4d81

-- TESTE MANUAL:
-- Copie e cole o link correto no navegador para testar a função