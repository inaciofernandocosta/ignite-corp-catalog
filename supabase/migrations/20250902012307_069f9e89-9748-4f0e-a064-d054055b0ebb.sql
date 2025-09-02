-- Corrigir a função do trigger removendo a coluna email gerada automaticamente
CREATE OR REPLACE FUNCTION public.auto_create_auth_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Quando o status muda para 'aprovado', criar conta no Authentication automaticamente
  IF OLD.status != 'aprovado' AND NEW.status = 'aprovado' THEN
    -- Verificar se a conta já existe no Authentication
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = NEW.email) THEN
      -- Criar conta no Authentication
      BEGIN
        DECLARE
          new_user_id UUID := gen_random_uuid();
        BEGIN
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
            NEW.email,
            '$2a$10$defaulthashfortemporarypassword',
            NOW(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('nome', NEW.nome, 'email', NEW.email),
            NOW(),
            NOW()
          );
          
          -- Criar identity sem a coluna email (é gerada automaticamente)
          INSERT INTO auth.identities (
            provider_id,
            id,
            user_id,
            identity_data,
            provider,
            created_at,
            updated_at
          ) VALUES (
            NEW.email,  -- provider_id é o email
            gen_random_uuid(),
            new_user_id,
            jsonb_build_object('sub', new_user_id::text, 'email', NEW.email),
            'email',
            NOW(),
            NOW()
          );
          
          RAISE NOTICE 'Conta de autenticação criada automaticamente para: %', NEW.email;
          
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Erro ao criar conta automática para %: %', NEW.email, SQLERRM;
        END;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar a conta manualmente para Mariana (sem coluna email)
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
    
    -- Criar identity sem a coluna email (é gerada automaticamente)
    INSERT INTO auth.identities (
      provider_id,
      id,
      user_id,
      identity_data,
      provider,
      created_at,
      updated_at
    ) VALUES (
      'mariana.tavares@vilanova.com.br',  -- provider_id é o email
      gen_random_uuid(),
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