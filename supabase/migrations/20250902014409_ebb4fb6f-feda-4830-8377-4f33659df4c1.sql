-- Primeiro, vamos remover qualquer trigger antigo que possa existir
DROP TRIGGER IF EXISTS trigger_auto_create_auth ON inscricoes_mentoria;
DROP FUNCTION IF EXISTS public.trigger_auto_create_auth_account();

-- Criar função melhorada para criação automática de contas
CREATE OR REPLACE FUNCTION public.trigger_auto_create_auth_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Log para debug
  RAISE NOTICE 'TRIGGER: Executando para email %, status OLD: %, NEW: %', NEW.email, OLD.status, NEW.status;
  
  -- Só criar conta quando status muda para 'aprovado'
  IF (OLD IS NULL OR OLD.status != 'aprovado') AND NEW.status = 'aprovado' THEN
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
        
        RAISE NOTICE 'TRIGGER: Conta de autenticação criada para: %', NEW.email;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'TRIGGER: Erro ao criar conta para %: %', NEW.email, SQLERRM;
        -- Não interromper o processo principal
      END;
    ELSE
      RAISE NOTICE 'TRIGGER: Conta já existe para: %', NEW.email;
    END IF;
  ELSE
    RAISE NOTICE 'TRIGGER: Condições não atendidas para: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar o trigger na tabela inscricoes_mentoria para INSERT e UPDATE
CREATE TRIGGER trigger_auto_create_auth
  AFTER INSERT OR UPDATE ON inscricoes_mentoria
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_create_auth_account();

-- Verificar se o trigger foi criado
SELECT 
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    t.action_timing
FROM information_schema.triggers t
WHERE t.trigger_name = 'trigger_auto_create_auth';