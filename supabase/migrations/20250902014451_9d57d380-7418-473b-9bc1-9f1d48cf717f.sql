-- Função para criar contas em lote para usuários aprovados existentes
CREATE OR REPLACE FUNCTION public.backfill_missing_auth_accounts()
RETURNS TABLE(email text, nome text, resultado text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  usuario RECORD;
  new_user_id UUID;
BEGIN
  -- Loop através de todos os usuários aprovados que não têm conta de auth
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
        usuario.email,
        '$2a$10$defaulthashfortemporarypassword',
        NOW(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('nome', usuario.nome, 'email', usuario.email),
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
        usuario.email,
        gen_random_uuid(),
        new_user_id,
        jsonb_build_object('sub', new_user_id::text, 'email', usuario.email),
        'email',
        NOW(),
        NOW()
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

-- Executar o backfill para criar contas para usuários existentes
SELECT * FROM public.backfill_missing_auth_accounts();