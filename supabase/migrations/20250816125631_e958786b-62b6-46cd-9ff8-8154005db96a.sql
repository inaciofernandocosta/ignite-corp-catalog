-- Criar função de atualização de timestamp se não existir
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar se existem usuários na tabela inscricoes_mentoria e criar usuários de auth correspondentes
DO $$
DECLARE
    inscricao RECORD;
BEGIN
    -- Para cada inscrição aprovada que não tem usuário de auth correspondente
    FOR inscricao IN 
        SELECT DISTINCT email, nome 
        FROM public.inscricoes_mentoria 
        WHERE status = 'aprovado' 
        AND ativo = true
        AND email NOT IN (
            SELECT email FROM auth.users WHERE email IS NOT NULL
        )
    LOOP
        -- Tentar criar usuário de auth
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
                raw_app_meta_data,
                raw_user_meta_data,
                is_super_admin,
                confirmation_token,
                email_change_token_new,
                email_change,
                email_change_token_current,
                email_change_confirm_status,
                last_sign_in_at,
                recovery_token,
                aud_confirmed_at,
                phone_confirmed_at
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                gen_random_uuid(),
                'authenticated',
                'authenticated',
                inscricao.email,
                crypt('MentoriaFutura123!', gen_salt('bf')), -- Senha padrão que o usuário deve alterar
                now(),
                now(),
                now(),
                '{"provider":"email","providers":["email"]}',
                jsonb_build_object('name', inscricao.nome),
                false,
                '',
                '',
                '',
                '',
                0,
                NULL,
                '',
                NULL,
                NULL
            );
            
            RAISE NOTICE 'Usuário de auth criado para %', inscricao.email;
        EXCEPTION
            WHEN unique_violation THEN
                RAISE NOTICE 'Usuário de auth já existe para %', inscricao.email;
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao criar usuário de auth para %. Erro: %', inscricao.email, SQLERRM;
        END;
    END LOOP;
END $$;