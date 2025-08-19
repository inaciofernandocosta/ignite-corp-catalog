-- FIX REMAINING FUNCTION SECURITY ISSUES
-- This migration addresses the remaining security warnings from the linter

-- ============================================================================
-- UPDATE ALL REMAINING FUNCTIONS TO SET PROPER SEARCH_PATH
-- ============================================================================

-- Fix trigger functions
CREATE OR REPLACE FUNCTION public.atualizar_progresso_curso()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.atualizar_vagas_ocupadas()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.ensure_approved_users_active()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Se o status está sendo alterado para 'aprovado', garantir que ativo seja true
  IF NEW.status = 'aprovado' AND OLD.status != 'aprovado' THEN
    NEW.ativo = true;
    NEW.data_aprovacao = COALESCE(NEW.data_aprovacao, NOW());
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_send_course_enrollment_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Chamar edge function para envio de e-mail de confirmação
  PERFORM public.call_edge_function(
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
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_send_approval_email_cursos()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se o status mudou para 'aprovado'
  IF OLD.status != 'aprovado' AND NEW.status = 'aprovado' THEN
    -- Chamar edge function de aprovação
    PERFORM public.call_edge_function(
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
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_enrollment_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- When inscricoes_cursos status changes to 'aprovado' or 'reprovado',
  -- sync the status in inscricoes_mentoria
  IF OLD.status != NEW.status AND NEW.status IN ('aprovado', 'reprovado') THEN
    UPDATE public.inscricoes_mentoria 
    SET 
      status = NEW.status,
      ativo = CASE WHEN NEW.status = 'aprovado' THEN true ELSE false END,
      data_aprovacao = CASE WHEN NEW.status = 'aprovado' THEN NOW() ELSE data_aprovacao END
    WHERE id = NEW.aluno_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_first_admin(admin_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id UUID;
  result JSON;
BEGIN
  -- Buscar ID do usuário pelo email
  SELECT id INTO target_user_id 
  FROM public.inscricoes_mentoria 
  WHERE email = admin_email AND ativo = TRUE;
  
  IF target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Usuário não encontrado ou não está ativo');
  END IF;
  
  -- Verificar se já tem algum role
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND active = TRUE) THEN
    RETURN json_build_object('success', false, 'message', 'Usuário já possui um role ativo');
  END IF;
  
  -- Desativar qualquer role existente (por segurança)
  UPDATE public.user_roles 
  SET active = FALSE 
  WHERE user_id = target_user_id;
  
  -- Criar role de admin (sem granted_by já que é o primeiro)
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (target_user_id, 'admin', target_user_id);
  
  RETURN json_build_object('success', true, 'message', 'Primeiro administrador criado com sucesso');
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_slug(title text)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(title),
          '[àáâãäå]', 'a', 'g'
        ),
        '[èéêë]', 'e', 'g'
      ),
      '[ìíîï]', 'i', 'g'
    ),
    '[^a-z0-9]', '-', 'g'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.backfill_auth_accounts()
RETURNS TABLE(email text, nome text, resultado text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.criar_conta_auth_para_inscrito(user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Cria o usuário no sistema de autenticação do Supabase
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    current_setting('app.instance_id')::uuid,
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt('temporaryPassword123!', gen_salt('bf')), -- Senha temporária
    now(), -- Confirma o email imediatamente
    '',
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );
  
  RETURN 'Usuário de autenticação criado para ' || user_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.gerar_token_admin()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.criar_token_ativacao_admin(admin_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    novo_token TEXT;
BEGIN
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
$$;

CREATE OR REPLACE FUNCTION public.criar_token_recuperacao_admin(admin_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    novo_token TEXT;
BEGIN
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
$$;

CREATE OR REPLACE FUNCTION public.validar_token_admin(token_input text, nova_senha_hash text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    admin_record RECORD;
    resultado JSON;
BEGIN
    -- Buscar admin pelo token (ativação ou recuperação)
    SELECT * INTO admin_record 
    FROM user_admin 
    WHERE (token_ativacao = token_input OR token_recuperacao = token_input)
    AND token_expira_em > NOW()
    AND ativo = true;
    
    -- Se não encontrou o token ou expirou
    IF NOT FOUND THEN
        RETURN '{"success": false, "message": "Token inválido ou expirado"}'::JSON;
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
        'message', 'Senha definida com sucesso',
        'admin_id', admin_record.id,
        'admin_email', admin_record.email,
        'admin_nome', admin_record.nome
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text, promoted_by_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_user_id UUID;
  promoter_user_id UUID;
  result JSON;
BEGIN
  -- Verificar se o usuário que está promovendo é admin
  IF NOT public.check_user_role(promoted_by_email, 'admin') THEN
    RETURN json_build_object('success', false, 'message', 'Apenas administradores podem promover usuários');
  END IF;
  
  -- Buscar ID do usuário a ser promovido
  SELECT id INTO target_user_id 
  FROM public.inscricoes_mentoria 
  WHERE email = user_email AND ativo = TRUE;
  
  IF target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Usuário não encontrado');
  END IF;
  
  -- Buscar ID do promotor
  SELECT id INTO promoter_user_id 
  FROM public.inscricoes_mentoria 
  WHERE email = promoted_by_email;
  
  -- Desativar role atual
  UPDATE public.user_roles 
  SET active = FALSE 
  WHERE user_id = target_user_id AND active = TRUE;
  
  -- Criar novo role de admin
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (target_user_id, 'admin', promoter_user_id);
  
  RETURN json_build_object('success', true, 'message', 'Usuário promovido para administrador com sucesso');
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_user_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Criar role de aluno quando usuário é aprovado
  IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status != 'aprovado') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'aluno');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.gerar_numero_certificado()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    numero TEXT;
    existe BOOLEAN;
BEGIN
    LOOP
        -- Gerar número no formato: CERT-YYYY-XXXXXX
        numero := 'CERT-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(floor(random() * 999999 + 1)::text, 6, '0');
        
        -- Verificar se já existe
        SELECT EXISTS(SELECT 1 FROM certificados_conclusao WHERE numero_certificado = numero) INTO existe;
        
        -- Se não existir, sair do loop
        IF NOT existe THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN numero;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_gerar_numero_certificado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.numero_certificado IS NULL OR NEW.numero_certificado = '' THEN
        NEW.numero_certificado := gerar_numero_certificado();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_course_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.titulo);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.verificar_vagas_disponiveis(p_curso_nome text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  vagas_disponiveis INTEGER;
BEGIN
  SELECT (vagas_totais - vagas_ocupadas) INTO vagas_disponiveis
  FROM public.vagas_curso 
  WHERE curso_nome = p_curso_nome 
  AND status = 'ativo'
  AND data_inicio >= CURRENT_DATE
  ORDER BY data_inicio ASC
  LIMIT 1;
  
  RETURN COALESCE(vagas_disponiveis, 0) > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.validar_email(email_input text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    RETURN email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.gerar_token_unico()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    token TEXT;
    existe BOOLEAN;
BEGIN
    LOOP
        -- Gerar token aleatório de 64 caracteres
        token := encode(gen_random_bytes(32), 'hex');
        
        -- Verificar se já existe
        SELECT EXISTS(SELECT 1 FROM inscricoes_mentoria WHERE token_validacao = token) INTO existe;
        
        -- Se não existir, sair do loop
        IF NOT existe THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN token;
END;
$$;

CREATE OR REPLACE FUNCTION public.limpar_tokens_expirados()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE inscricoes_mentoria 
    SET token_validacao = NULL
    WHERE token_validacao IS NOT NULL 
    AND data_aprovacao < NOW() - INTERVAL '48 hours'
    AND ativo = false;
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_log_inscricao(p_inscricao_id bigint, p_acao text, p_detalhes jsonb DEFAULT NULL::jsonb, p_ip_origem inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO logs_inscricao (inscricao_id, acao, detalhes, ip_origem, user_agent)
    VALUES (p_inscricao_id, p_acao, p_detalhes, p_ip_origem, p_user_agent);
END;
$$;

-- ============================================================================
-- REVOKE ALL DANGEROUS HTTP FUNCTIONS FROM PUBLIC (SECURITY HARDENING)
-- ============================================================================

-- Revoke dangerous HTTP functions that could be exploited
REVOKE ALL ON FUNCTION public.http(http_request) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.http_get(character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.http_post(character varying, character varying, character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.http_put(character varying, character varying, character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.http_patch(character varying, character varying, character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.http_delete(character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.http_delete(character varying, character varying, character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.http_head(character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.http_get(character varying, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.http_post(character varying, jsonb) FROM PUBLIC;