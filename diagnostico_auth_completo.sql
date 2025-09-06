-- Script de Diagnóstico de Autenticação
-- Execute este script completo no SQL Editor do Supabase

-- Criar uma CTE temporária com os emails para análise
WITH input_emails AS (
  SELECT unnest(ARRAY[
    'jane.yamamoto@vilanova.com.br',
    'luis.dionisio@vilanova.com.br', 
    'guilherme.costa@gmail.com',
    'sandro.sales@vilanova.com.br',
    'angela.barbosa@vilanova.com.br',
    'rogerio.garcia@vilanova.com.br',
    'daniel.radaelli@vilanova.com.br',
    'janine.silva@vilanova.com.br',
    'marcos.paulo@vilanova.com.br',
    'thalita.alvarenga@vilanova.com.br',
    'fernando.costa@mentoriafutura.com.br',
    'paulo.lago@vilanova.com.br',
    'caroline.morgao@vilanova.com.br',
    'ana.fernandes@vilanova.com.br',
    'geovana.dias@vilanova.com.br',
    'pablo.silva@vilanova.com.br',
    'comex2@vilanova.com.br',
    'dulce.behnen@vilanova.com.br',
    'luiza.araujo@vilanova.com.br',
    'amanda.souza@vilanova.com.br',
    'eliane.allegrini@vilanova.com.br',
    'julia.chiaretto@vilanova.com.br',
    'leandro.ramos@vilasul.com.br',
    'daniel.andrade@vilanova.com.br',
    'aloizio.batagini@vilanova.com.br',
    'alice.souza@vilanova.com.br',
    'maurilio.bernardino@vilanova.com.br',
    'raiane.reis@vilanova.com.br',
    'rafaella.alves@vilanova.com.br',
    'gabriela.moraes@vilanova.com.br',
    'bruno.sgarcia@vilanova.com.br',
    'alexandre.rabelo@vilanova.com.br',
    'julioc.silva@vilanova.com.br',
    'paulo.batista@vilanova.com.br',
    'alex.lemes@vilanova.com.br',
    'cecilia.souza@vilanova.com.br',
    'jonas.silva@vilasul.com.br',
    'mariana.tavares@vilanova.com.br',
    'geisamara.agassi@vilanova.com.br',
    'leticia.marques@vilanova.com.br'
  ]) AS email
)

-- 1. ANÁLISE GERAL DOS DADOS
SELECT '=== RESUMO GERAL ===' as secao, NULL as email, NULL as problema, NULL as detalhes
UNION ALL
SELECT 
  'Total de emails analisados' as secao,
  NULL as email,
  count(*)::text as problema,
  NULL as detalhes
FROM input_emails

UNION ALL
SELECT 
  'Usuários em inscricoes_mentoria' as secao,
  NULL as email,
  count(*)::text as problema,
  'Aprovados: ' || count(*) FILTER (WHERE im.status = 'aprovado' AND im.ativo = true)::text as detalhes
FROM input_emails ie
LEFT JOIN public.inscricoes_mentoria im ON im.email = ie.email

UNION ALL
SELECT 
  'Usuários em auth.users' as secao,
  NULL as email,
  count(*)::text as problema,
  'Confirmados: ' || count(*) FILTER (WHERE au.email_confirmed_at IS NOT NULL)::text as detalhes
FROM input_emails ie
LEFT JOIN auth.users au ON au.email = ie.email

UNION ALL
SELECT '=== PROBLEMAS ENCONTRADOS ===' as secao, NULL, NULL, NULL

-- 2. USUÁRIOS SEM CONTA DE AUTENTICAÇÃO
UNION ALL
SELECT 
  'SEM AUTH.USERS' as secao,
  ie.email,
  'Usuário aprovado sem conta de autenticação' as problema,
  'Status: ' || im.status || ', Ativo: ' || im.ativo::text as detalhes
FROM input_emails ie
JOIN public.inscricoes_mentoria im ON im.email = ie.email
LEFT JOIN auth.users au ON au.email = ie.email
WHERE au.id IS NULL 
  AND im.status = 'aprovado' 
  AND im.ativo = true

-- 3. USUÁRIOS COM AUTH MAS SEM INSCRICAO_MENTORIA
UNION ALL
SELECT 
  'SEM INSCRICAO' as secao,
  ie.email,
  'Conta de auth sem inscrição válida' as problema,
  'Auth criado: ' || au.created_at::text as detalhes
FROM input_emails ie
JOIN auth.users au ON au.email = ie.email
LEFT JOIN public.inscricoes_mentoria im ON im.email = ie.email
WHERE im.id IS NULL OR im.status != 'aprovado' OR im.ativo != true

-- 4. USUÁRIOS COM IDENTITIES INCONSISTENTES
UNION ALL
SELECT 
  'IDENTITIES PROBLEMA' as secao,
  au.email,
  'Email inconsistente em identity' as problema,
  'Identity email: ' || (ai.identity_data->>'email')::text as detalhes
FROM auth.users au
JOIN auth.identities ai ON ai.user_id = au.id
JOIN input_emails ie ON ie.email = au.email
WHERE ai.identity_data->>'email' != au.email

-- 5. USUÁRIOS COM SENHAS TEMPORÁRIAS 
UNION ALL
SELECT 
  'SENHA TEMPORARIA' as secao,
  au.email,
  'Usando hash de senha temporária' as problema,
  'Criado: ' || au.created_at::date::text as detalhes
FROM auth.users au
JOIN input_emails ie ON ie.email = au.email
WHERE au.encrypted_password = '$2a$10$defaulthashfortemporarypassword'

-- 6. DUPLICATAS EM INSCRICOES_MENTORIA
UNION ALL
SELECT 
  'DUPLICATA INSCRICAO' as secao,
  email,
  'Email duplicado em inscricoes_mentoria' as problema,
  'Quantidade: ' || count(*)::text as detalhes
FROM input_emails ie
JOIN public.inscricoes_mentoria im ON im.email = ie.email
GROUP BY email
HAVING count(*) > 1

-- 7. DUPLICATAS EM AUTH.USERS  
UNION ALL
SELECT 
  'DUPLICATA AUTH' as secao,
  email,
  'Email duplicado em auth.users' as problema,
  'Quantidade: ' || count(*)::text as detalhes
FROM input_emails ie
JOIN auth.users au ON au.email = ie.email
GROUP BY email
HAVING count(*) > 1

ORDER BY 
  CASE 
    WHEN secao LIKE '===%' THEN 1
    WHEN secao = 'Total de emails analisados' THEN 2
    WHEN secao LIKE 'Usuários em%' THEN 3
    WHEN secao = 'SEM AUTH.USERS' THEN 4
    WHEN secao = 'SEM INSCRICAO' THEN 5
    WHEN secao = 'IDENTITIES PROBLEMA' THEN 6
    WHEN secao = 'SENHA TEMPORARIA' THEN 7
    WHEN secao = 'DUPLICATA INSCRICAO' THEN 8
    WHEN secao = 'DUPLICATA AUTH' THEN 9
    ELSE 99
  END,
  email NULLS FIRST;