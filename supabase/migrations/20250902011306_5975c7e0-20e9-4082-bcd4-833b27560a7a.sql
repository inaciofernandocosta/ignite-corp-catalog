-- Remover todos os dados relacionados à Mariana antes de deletar da auth
-- Primeiro pegar os IDs necessários
WITH user_ids AS (
  SELECT 
    au.id as auth_id,
    im.id as inscricao_id
  FROM auth.users au
  LEFT JOIN inscricoes_mentoria im ON im.email = au.email
  WHERE au.email = 'mariana.tavares@vilanova.com.br'
)
-- Deletar da tabela user_roles se houver
DELETE FROM user_roles 
WHERE user_id IN (SELECT inscricao_id FROM user_ids WHERE inscricao_id IS NOT NULL);

-- Deletar da tabela inscricoes_cursos se houver
WITH user_ids AS (
  SELECT 
    au.id as auth_id,
    im.id as inscricao_id
  FROM auth.users au
  LEFT JOIN inscricoes_mentoria im ON im.email = au.email
  WHERE au.email = 'mariana.tavares@vilanova.com.br'
)
DELETE FROM inscricoes_cursos 
WHERE aluno_id IN (SELECT inscricao_id FROM user_ids WHERE inscricao_id IS NOT NULL);

-- Deletar da tabela inscricoes_mentoria
DELETE FROM inscricoes_mentoria WHERE email = 'mariana.tavares@vilanova.com.br';

-- Deletar das identidades auth
DELETE FROM auth.identities 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'mariana.tavares@vilanova.com.br');

-- Finalmente deletar do auth.users
DELETE FROM auth.users WHERE email = 'mariana.tavares@vilanova.com.br';