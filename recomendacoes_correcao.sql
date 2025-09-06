-- Script de Recomendações de Correção
-- Execute APÓS o diagnóstico para ver as recomendações específicas

WITH input_emails AS (
  SELECT unnest(ARRAY[
    'jane.yamamoto@vilanova.com.br', 'luis.dionisio@vilanova.com.br', 'guilherme.costa@gmail.com',
    'sandro.sales@vilanova.com.br', 'angela.barbosa@vilanova.com.br', 'rogerio.garcia@vilanova.com.br',
    'daniel.radaelli@vilanova.com.br', 'janine.silva@vilanova.com.br', 'marcos.paulo@vilanova.com.br',
    'thalita.alvarenga@vilanova.com.br', 'fernando.costa@mentoriafutura.com.br', 'paulo.lago@vilanova.com.br',
    'caroline.morgao@vilanova.com.br', 'ana.fernandes@vilanova.com.br', 'geovana.dias@vilanova.com.br',
    'pablo.silva@vilanova.com.br', 'comex2@vilanova.com.br', 'dulce.behnen@vilanova.com.br',
    'luiza.araujo@vilanova.com.br', 'amanda.souza@vilanova.com.br', 'eliane.allegrini@vilanova.com.br',
    'julia.chiaretto@vilanova.com.br', 'leandro.ramos@vilasul.com.br', 'daniel.andrade@vilanova.com.br',
    'aloizio.batagini@vilanova.com.br', 'alice.souza@vilanova.com.br', 'maurilio.bernardino@vilanova.com.br',
    'raiane.reis@vilanova.com.br', 'rafaella.alves@vilanova.com.br', 'gabriela.moraes@vilanova.com.br',
    'bruno.sgarcia@vilanova.com.br', 'alexandre.rabelo@vilanova.com.br', 'julioc.silva@vilanova.com.br',
    'paulo.batista@vilanova.com.br', 'alex.lemes@vilanova.com.br', 'cecilia.souza@vilanova.com.br',
    'jonas.silva@vilasul.com.br', 'mariana.tavares@vilanova.com.br', 'geisamara.agassi@vilanova.com.br',
    'leticia.marques@vilanova.com.br'
  ]) AS email
),
analise AS (
  SELECT 
    ie.email,
    im.id as inscricao_id,
    im.nome,
    im.status as inscricao_status,
    im.ativo as inscricao_ativo,
    au.id as auth_user_id,
    au.email_confirmed_at,
    au.encrypted_password,
    count(ai.id) as identities_count
  FROM input_emails ie
  LEFT JOIN public.inscricoes_mentoria im ON im.email = ie.email
  LEFT JOIN auth.users au ON au.email = ie.email  
  LEFT JOIN auth.identities ai ON ai.user_id = au.id
  GROUP BY ie.email, im.id, im.nome, im.status, im.ativo, au.id, au.email_confirmed_at, au.encrypted_password
)

SELECT 
  email,
  nome,
  CASE 
    WHEN inscricao_id IS NULL THEN 
      '❌ CRÍTICO: Sem registro em inscricoes_mentoria'
    WHEN inscricao_status != 'aprovado' OR NOT inscricao_ativo THEN 
      '⚠️ PENDENTE: Status = ' || inscricao_status || ', Ativo = ' || inscricao_ativo::text
    WHEN auth_user_id IS NULL THEN 
      '🔧 AÇÃO NECESSÁRIA: Criar conta de autenticação'
    WHEN identities_count = 0 THEN 
      '🔧 AÇÃO NECESSÁRIA: Criar identity para usuário'
    WHEN encrypted_password = '$2a$10$defaulthashfortemporarypassword' THEN 
      '⚠️ SENHA TEMPORÁRIA: Usuário deve alterar senha'
    ELSE 
      '✅ OK: Configuração correta'
  END as status_diagnóstico,
  
  CASE 
    WHEN inscricao_id IS NULL THEN 
      'Usuário deve se cadastrar pelo formulário oficial'
    WHEN inscricao_status != 'aprovado' OR NOT inscricao_ativo THEN 
      'Admin deve aprovar este usuário primeiro'
    WHEN auth_user_id IS NULL THEN 
      'Executar função admin-sync-auth-users para criar'
    WHEN identities_count = 0 THEN 
      'PROBLEMA CRÍTICO: Conta corrompida - contate suporte técnico'
    WHEN encrypted_password = '$2a$10$defaulthashfortemporarypassword' THEN 
      'Usuário deve usar "Esqueci minha senha" para definir senha'
    ELSE 
      'Nenhuma ação necessária'
  END as recomendação

FROM analise
ORDER BY 
  CASE 
    WHEN inscricao_id IS NULL THEN 1
    WHEN inscricao_status != 'aprovado' OR NOT inscricao_ativo THEN 2
    WHEN auth_user_id IS NULL THEN 3
    WHEN identities_count = 0 THEN 4
    WHEN encrypted_password = '$2a$10$defaulthashfortemporarypassword' THEN 5
    ELSE 6
  END,
  email;