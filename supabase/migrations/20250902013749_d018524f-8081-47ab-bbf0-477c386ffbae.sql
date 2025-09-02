-- Criar trigger para criação automática de contas de autenticação
CREATE OR REPLACE FUNCTION public.trigger_auto_create_auth_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Só criar conta quando status muda para 'aprovado'
  IF OLD.status != 'aprovado' AND NEW.status = 'aprovado' THEN
    -- Verificar se já existe conta no auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = NEW.email) THEN
      -- Gerar ID seguro
      new_user_id := gen_random_uuid();
      
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
        
        -- Criar identity
        INSERT INTO auth.identities (
          provider_id,
          id,
          user_id,
          identity_data,
          provider,
          created_at,
          updated_at
        ) VALUES (
          NEW.email,
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
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar o trigger na tabela inscricoes_mentoria
DROP TRIGGER IF EXISTS trigger_auto_create_auth ON inscricoes_mentoria;

CREATE TRIGGER trigger_auto_create_auth
  AFTER UPDATE ON inscricoes_mentoria
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_create_auth_account();