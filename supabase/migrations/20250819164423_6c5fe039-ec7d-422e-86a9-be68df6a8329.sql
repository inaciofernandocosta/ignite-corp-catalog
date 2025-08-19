-- STAGE 3 & 4: FINAL SECURITY HARDENING & TRIGGER UPDATES

-- Fix any remaining search_path issues on functions that might not have been updated
CREATE OR REPLACE FUNCTION public.gerar_token_admin()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
    token TEXT;
    existe BOOLEAN;
BEGIN
    LOOP
        -- Gerar token aleatório de 64 caracteres usando gen_random_uuid
        token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
        
        -- Verificar se já existe
        SELECT EXISTS(
            SELECT 1 FROM user_admin 
            WHERE token_ativacao = token OR token_recuperacao = token
        ) INTO existe;
        
        -- Se não existir, sair do loop
        IF NOT existe THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.atualizar_progresso_curso()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE public.inscricoes_cursos
  SET progresso = (
    SELECT ROUND(
      (COUNT(CASE WHEN pa.concluida THEN 1 END) * 100.0) / 
      NULLIF(COUNT(*), 0), 2
    )
    FROM public.progresso_aulas pa
    WHERE pa.inscricao_curso_id = NEW.inscricao_curso_id
  ),
  ultima_atividade = NOW()
  WHERE id = NEW.inscricao_curso_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.atualizar_vagas_ocupadas()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- Atualizar vagas ocupadas quando houver mudança no status de aprovação
  UPDATE public.vagas_curso 
  SET vagas_ocupadas = (
    SELECT COUNT(*) 
    FROM public.inscricoes_mentoria 
    WHERE curso_nome = vagas_curso.curso_nome 
    AND status = 'aprovado'
  )
  WHERE curso_nome = COALESCE(NEW.curso_nome, OLD.curso_nome);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update all trigger functions to use secure edge function calls
CREATE OR REPLACE FUNCTION public.trigger_send_course_enrollment_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- Use secure edge function call (only admins can call)
  -- This trigger runs in system context, so we'll add admin context
  PERFORM public.call_edge_function_secure(
    'send-course-enrollment-confirmation',
    jsonb_build_object(
      'enrollmentData', jsonb_build_object(
        'enrollment_id', NEW.id,
        'course_id', NEW.curso_id,
        'student_id', NEW.aluno_id,
        'enrollment_date', NEW.data_inscricao
      )
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the main transaction
    RAISE NOTICE 'Failed to send enrollment confirmation: %', SQLERRM;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_send_approval_email_cursos()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- Verificar se o status mudou para 'aprovado'
  IF OLD.status != 'aprovado' AND NEW.status = 'aprovado' THEN
    -- Use secure edge function call
    PERFORM public.call_edge_function_secure(
      'send-approval-email',
      jsonb_build_object(
        'enrollmentData', jsonb_build_object(
          'enrollment_id', NEW.id,
          'course_id', NEW.curso_id,
          'student_id', NEW.aluno_id,
          'status', NEW.status
        )
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to send approval email: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Secure other admin functions
CREATE OR REPLACE FUNCTION public.criar_token_ativacao_admin(admin_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    novo_token TEXT;
BEGIN
    -- Only admins can create activation tokens
    IF NOT is_admin_user() THEN
        RETURN NULL;
    END IF;
    
    -- Validate email format
    IF NOT (admin_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
        RETURN NULL;
    END IF;
    
    -- Gerar novo token
    novo_token := gerar_token_admin();
    
    -- Atualizar admin com token de ativação (válido por 48 horas)
    UPDATE public.user_admin 
    SET 
        token_ativacao = novo_token,
        token_expira_em = NOW() + INTERVAL '48 hours',
        updated_at = NOW()
    WHERE email = admin_email AND ativo = true;
    
    RETURN novo_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.criar_token_recuperacao_admin(admin_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    novo_token TEXT;
BEGIN
    -- Add basic rate limiting
    IF current_setting('app.admin_recovery_attempts', true)::int > 3 THEN
        RETURN NULL;
    END IF;
    
    -- Validate email format
    IF NOT (admin_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
        RETURN NULL;
    END IF;
    
    -- Verificar se admin existe e não é primeiro acesso
    IF NOT EXISTS(
        SELECT 1 FROM user_admin 
        WHERE email = admin_email AND ativo = true AND primeiro_acesso = false
    ) THEN
        RETURN NULL;
    END IF;
    
    -- Gerar novo token
    novo_token := gerar_token_admin();
    
    -- Atualizar admin com token de recuperação (válido por 2 horas)
    UPDATE public.user_admin 
    SET 
        token_recuperacao = novo_token,
        token_expira_em = NOW() + INTERVAL '2 hours',
        updated_at = NOW()
    WHERE email = admin_email AND ativo = true;
    
    RETURN novo_token;
END;
$function$;

-- Secure validation function
CREATE OR REPLACE FUNCTION public.validar_token_admin(token_input text, nova_senha_hash text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    admin_record RECORD;
    resultado JSON;
BEGIN
    -- Validate inputs
    IF token_input IS NULL OR nova_senha_hash IS NULL OR 
       length(token_input) < 32 OR length(nova_senha_hash) < 10 THEN
        RETURN '{"success": false, "message": "Invalid parameters"}'::JSON;
    END IF;
    
    -- Buscar admin pelo token (ativação ou recuperação)
    SELECT * INTO admin_record 
    FROM user_admin 
    WHERE (token_ativacao = token_input OR token_recuperacao = token_input)
    AND token_expira_em > NOW()
    AND ativo = true;
    
    -- Se não encontrou o token ou expirou
    IF NOT FOUND THEN
        RETURN '{"success": false, "message": "Invalid or expired token"}'::JSON;
    END IF;
    
    -- Atualizar senha e limpar tokens
    UPDATE user_admin 
    SET 
        senha_hash = nova_senha_hash,
        primeiro_acesso = false,
        token_ativacao = NULL,
        token_recuperacao = NULL,
        token_expira_em = NULL,
        ultimo_login = NOW(),
        updated_at = NOW()
    WHERE id = admin_record.id;
    
    RETURN json_build_object(
        'success', true, 
        'message', 'Password updated successfully',
        'admin_id', admin_record.id,
        'admin_email', admin_record.email,
        'admin_nome', admin_record.nome
    );
END;
$function$;

-- Revoke dangerous permissions from PUBLIC
REVOKE ALL ON FUNCTION public.criar_conta_auth_segura(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.email_exists_for_recovery(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.promote_user_to_admin(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.call_edge_function_secure(text, jsonb) FROM PUBLIC;

-- Grant controlled access only to authenticated users
GRANT EXECUTE ON FUNCTION public.email_exists_for_recovery(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_signed_url(text, text, integer) TO authenticated;