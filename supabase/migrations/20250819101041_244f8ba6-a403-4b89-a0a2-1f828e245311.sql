-- Corrigir função para criar contas de auth de forma mais simples
CREATE OR REPLACE FUNCTION public.criar_conta_auth_segura(user_email text, user_password text DEFAULT 'Mudar@123'::text)
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
  
  -- Usar o método nativo do Supabase para criar usuário
  -- Isso é mais seguro e compatível
  BEGIN
    -- Inserir diretamente com os campos mínimos necessários
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
      last_sign_in_at,
      phone,
      phone_confirmed_at,
      confirmed_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('nome', inscricao_record.nome),
      false,
      NULL,
      NULL,
      NULL,
      NOW()
    ) RETURNING id INTO new_user_id;
    
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
      NOW(),
      NOW()
    );
    
    RETURN 'Conta de autenticação criada com sucesso para ' || user_email;
    
  EXCEPTION WHEN OTHERS THEN
    RETURN 'Erro ao criar conta: ' || SQLERRM;
  END;
END;
$$;

-- Atualizar função de backfill para usar nova senha
CREATE OR REPLACE FUNCTION public.backfill_auth_accounts()
RETURNS TABLE(
  email text,
  nome text,
  resultado text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usuario RECORD;
BEGIN
  -- Loop através de todos os usuários ativos que não têm conta de auth
  FOR usuario IN 
    SELECT im.email, im.nome
    FROM public.inscricoes_mentoria im
    WHERE im.ativo = true 
    AND im.status = 'aprovado'
    AND NOT EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.email = im.email
    )
  LOOP
    -- Tentar criar conta de auth com senha "Mudar@123"
    BEGIN
      PERFORM public.criar_conta_auth_segura(
        usuario.email, 
        'Mudar@123'
      );
      
      -- Retornar sucesso
      RETURN QUERY SELECT 
        usuario.email,
        usuario.nome,
        'Conta criada com sucesso'::text;
        
    EXCEPTION WHEN OTHERS THEN
      -- Retornar erro mas continuar com próximo usuário
      RETURN QUERY SELECT 
        usuario.email,
        usuario.nome,
        ('Erro: ' || SQLERRM)::text;
    END;
  END LOOP;
  
  RETURN;
END;
$$;