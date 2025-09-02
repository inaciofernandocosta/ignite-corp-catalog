-- Criar conta no Authentication para Mariana que já existe
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- Verificar se a conta já existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mariana.tavares@vilanova.com.br') THEN
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
      'mariana.tavares@vilanova.com.br',
      '$2a$10$defaulthashfortemporarypassword',
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"nome": "Mariana Pereira Tavares", "email": "mariana.tavares@vilanova.com.br"}',
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
      jsonb_build_object('sub', new_user_id::text, 'email', 'mariana.tavares@vilanova.com.br'),
      'email',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Conta de autenticação criada para Mariana Pereira Tavares';
  ELSE
    RAISE NOTICE 'Conta já existe para mariana.tavares@vilanova.com.br';
  END IF;
END $$;