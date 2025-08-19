-- Criar função simples que usa o método correto do Supabase
CREATE OR REPLACE FUNCTION public.criar_conta_auth_segura(user_email text, user_password text DEFAULT 'Mudar@123'::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  -- Gerar ID para o usuário
  new_user_id := gen_random_uuid();
  
  -- Inserir com senha básica (será alterada no primeiro acesso)
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      phone_change,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmed_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      new_user_id,
      'authenticated',
      'authenticated', 
      user_email,
      '$2a$10$defaulthashedpasswordtemporary',  -- Password temporário simples
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('nome', inscricao_record.nome, 'email', user_email),
      false,
      NOW()
    );
    
    -- Inserir identidade
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
      jsonb_build_object('sub', new_user_id::text, 'email', user_email, 'email_verified', true, 'phone_verified', false),
      'email',
      NOW(),
      NOW()
    );
    
    RETURN 'Conta de autenticação criada com sucesso para ' || user_email;
    
  EXCEPTION WHEN OTHERS THEN
    RETURN 'Erro ao criar conta: ' || SQLERRM;
  END;
END;
$$;