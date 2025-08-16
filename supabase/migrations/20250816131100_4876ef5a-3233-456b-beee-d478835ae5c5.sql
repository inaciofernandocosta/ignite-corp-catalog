-- Criar extensão pgcrypto se não existir (para gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função melhorada para criar conta de autenticação para usuários inscritos
CREATE OR REPLACE FUNCTION public.criar_conta_auth_segura(user_email text, user_password text DEFAULT 'temporaryPassword123!')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inscricao_record RECORD;
  new_user_id UUID;
BEGIN
  -- Verificar se usuário existe em inscricoes_mentoria
  SELECT * INTO inscricao_record
  FROM public.inscricoes_mentoria 
  WHERE email = user_email AND ativo = true;
  
  IF NOT FOUND THEN
    RETURN 'Usuário não encontrado ou não está ativo';
  END IF;
  
  -- Verificar se já existe no auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RETURN 'Usuário já existe no sistema de autenticação';
  END IF;
  
  -- Gerar novo UUID para o usuário
  new_user_id := gen_random_uuid();
  
  -- Inserir no auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    phone_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    phone_change,
    phone_change_token,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_change_sent_at,
    email_change_sent_at,
    confirmed_at,
    last_sign_in_at,
    app_metadata,
    user_metadata,
    is_sso_user
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    new_user_id,
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    NULL,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    0,
    NULL,
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('nome', inscricao_record.nome),
    false,
    now(),
    now(),
    NULL,
    NULL,
    NULL,
    now(),
    NULL,
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('nome', inscricao_record.nome),
    false
  );
  
  -- Inserir na tabela de identidades
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', user_email),
    'email',
    NULL,
    now(),
    now()
  );
  
  RETURN 'Conta de autenticação criada com sucesso para ' || user_email;
END;
$$;

-- Criar conta para o usuário específico
SELECT public.criar_conta_auth_segura('inacio.fernando@gmail.com', 'admin123');