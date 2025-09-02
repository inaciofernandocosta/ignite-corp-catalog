-- Criar função para admins criarem contas de auth para usuários aprovados
CREATE OR REPLACE FUNCTION public.criar_conta_auth_admin(user_email text, user_password text DEFAULT 'Mudar@123')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  inscricao_record RECORD;
  new_user_id UUID;
BEGIN
  -- Verificar se user_email existe e está aprovado
  SELECT * INTO inscricao_record
  FROM public.inscricoes_mentoria 
  WHERE email = user_email AND ativo = true AND status = 'aprovado';
  
  IF NOT FOUND THEN
    RETURN 'Usuário não encontrado, não está ativo ou não está aprovado';
  END IF;
  
  -- Verificar se já existe no auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RETURN 'Usuário já existe no sistema de autenticação';
  END IF;
  
  -- Gerar ID seguro
  new_user_id := gen_random_uuid();
  
  -- Criar usuário no auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    new_user_id,
    'authenticated',
    'authenticated', 
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('nome', inscricao_record.nome, 'email', user_email),
    NOW(),
    NOW()
  );
  
  -- Criar identity
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', user_email),
    'email',
    NOW(),
    NOW()
  );
  
  RETURN 'Conta criada com sucesso para ' || user_email || ' com senha temporária: ' || user_password;
  
EXCEPTION WHEN OTHERS THEN
  RETURN 'Erro ao criar conta: ' || SQLERRM;
END;
$$;

-- Criar conta para a Mariana especificamente
SELECT criar_conta_auth_admin('mariana.tavares@vilanova.com.br');

-- Verificar se há outros usuários aprovados sem conta de auth
SELECT 
  im.email, 
  im.nome, 
  im.status, 
  im.ativo,
  CASE WHEN au.email IS NULL THEN 'SEM CONTA AUTH' ELSE 'COM CONTA AUTH' END as auth_status
FROM inscricoes_mentoria im
LEFT JOIN auth.users au ON au.email = im.email
WHERE im.status = 'aprovado' AND im.ativo = true
ORDER BY auth_status, im.email;