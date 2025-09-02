-- Corrigir função com provider_id obrigatório
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
  WHERE email = user_email AND ativo = true AND status = 'aprovado'
  LIMIT 1;
  
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
    '$2a$10$defaulthashfortemporarypassword',
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('nome', inscricao_record.nome, 'email', user_email),
    NOW(),
    NOW()
  );
  
  -- Criar identity com provider_id correto
  INSERT INTO auth.identities (
    provider_id,
    id,
    user_id,
    identity_data,
    provider,
    created_at,
    updated_at
  ) VALUES (
    new_user_id::text,  -- provider_id é obrigatório
    new_user_id,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', user_email),
    'email',
    NOW(),
    NOW()
  );
  
  RETURN 'Conta criada com sucesso para ' || user_email || '. Use "Esqueci minha senha" para definir uma nova senha.';
  
EXCEPTION WHEN OTHERS THEN
  RETURN 'Erro ao criar conta: ' || SQLERRM;
END;
$$;

-- Criar conta para a Mariana novamente
SELECT criar_conta_auth_admin('mariana.tavares@vilanova.com.br');