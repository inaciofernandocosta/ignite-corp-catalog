-- COMPREHENSIVE SECURITY MIGRATION
-- This migration fixes critical security vulnerabilities identified in the security review

-- ============================================================================
-- 1. DROP ALL PERMISSIVE RLS POLICIES AND REPLACE WITH SECURE ONES
-- ============================================================================

-- Drop permissive policies on cursos
DROP POLICY IF EXISTS "Permitir atualizar cursos para todos" ON public.cursos;
DROP POLICY IF EXISTS "Permitir criar cursos para todos" ON public.cursos;
DROP POLICY IF EXISTS "Permitir deletar cursos para todos" ON public.cursos;
DROP POLICY IF EXISTS "Permitir ver todos os cursos para todos" ON public.cursos;

-- Create secure policies for cursos
CREATE POLICY "Admins can manage cursos" ON public.cursos
FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE POLICY "Public can view active cursos" ON public.cursos
FOR SELECT USING (status = 'active');

-- Drop permissive policies on curso_modulos
DROP POLICY IF EXISTS "Permitir atualizar módulos para todos" ON public.curso_modulos;
DROP POLICY IF EXISTS "Permitir criar módulos para todos" ON public.curso_modulos;
DROP POLICY IF EXISTS "Permitir deletar módulos para todos" ON public.curso_modulos;
DROP POLICY IF EXISTS "Permitir ver todos os módulos para todos" ON public.curso_modulos;

-- Create secure policies for curso_modulos
CREATE POLICY "Admins can manage modulos" ON public.curso_modulos
FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE POLICY "Enrolled users can view modulos" ON public.curso_modulos
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM inscricoes_cursos ic
    JOIN inscricoes_mentoria im ON im.id = ic.aluno_id
    WHERE ic.curso_id = curso_modulos.curso_id
    AND im.email = (auth.jwt() ->> 'email')
    AND im.ativo = true
    AND ic.status = 'aprovado'
  )
);

-- Drop permissive policies on modulo_aulas
DROP POLICY IF EXISTS "Permitir atualizar aulas para todos" ON public.modulo_aulas;
DROP POLICY IF EXISTS "Permitir criar aulas para todos" ON public.modulo_aulas;
DROP POLICY IF EXISTS "Permitir deletar aulas para todos" ON public.modulo_aulas;
DROP POLICY IF EXISTS "Permitir ver todas as aulas para todos" ON public.modulo_aulas;

-- Create secure policies for modulo_aulas
CREATE POLICY "Admins can manage aulas" ON public.modulo_aulas
FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE POLICY "Enrolled users can view aulas" ON public.modulo_aulas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM curso_modulos cm
    JOIN inscricoes_cursos ic ON ic.curso_id = cm.curso_id
    JOIN inscricoes_mentoria im ON im.id = ic.aluno_id
    WHERE cm.id = modulo_aulas.modulo_id
    AND im.email = (auth.jwt() ->> 'email')
    AND im.ativo = true
    AND ic.status = 'aprovado'
  )
);

-- Drop permissive policies on modulo_materiais
DROP POLICY IF EXISTS "Permitir atualizar materiais para todos" ON public.modulo_materiais;
DROP POLICY IF EXISTS "Permitir criar materiais para todos" ON public.modulo_materiais;
DROP POLICY IF EXISTS "Permitir deletar materiais para todos" ON public.modulo_materiais;
DROP POLICY IF EXISTS "Permitir ver todos os materiais para todos" ON public.modulo_materiais;

-- Create secure policies for modulo_materiais
CREATE POLICY "Admins can manage materiais" ON public.modulo_materiais
FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE POLICY "Enrolled users can view materiais" ON public.modulo_materiais
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM curso_modulos cm
    JOIN inscricoes_cursos ic ON ic.curso_id = cm.curso_id
    JOIN inscricoes_mentoria im ON im.id = ic.aluno_id
    WHERE cm.id = modulo_materiais.modulo_id
    AND im.email = (auth.jwt() ->> 'email')
    AND im.ativo = true
    AND ic.status = 'aprovado'
  )
);

-- Drop permissive policies on vagas_curso
DROP POLICY IF EXISTS "Permitir atualização de vagas" ON public.vagas_curso;
DROP POLICY IF EXISTS "Permitir exclusão de vagas" ON public.vagas_curso;
DROP POLICY IF EXISTS "Permitir inserção de vagas" ON public.vagas_curso;

-- Create secure policies for vagas_curso
CREATE POLICY "Admins can manage vagas" ON public.vagas_curso
FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

-- Keep public SELECT for vagas as this is needed for course availability

-- Drop permissive policies on certificados_conclusao
DROP POLICY IF EXISTS "Permitir acesso completo aos certificados" ON public.certificados_conclusao;

-- Create secure policies for certificados_conclusao
CREATE POLICY "Admins can manage certificados" ON public.certificados_conclusao
FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE POLICY "Users can view their own certificados" ON public.certificados_conclusao
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM inscricoes_cursos ic
    JOIN inscricoes_mentoria im ON im.id = ic.aluno_id
    WHERE ic.id = certificados_conclusao.inscricao_curso_id
    AND im.email = (auth.jwt() ->> 'email')
    AND im.ativo = true
  )
);

-- ============================================================================
-- 2. FIX USER_ROLES PRIVILEGE ESCALATION
-- ============================================================================

-- Drop permissive policies on user_roles
DROP POLICY IF EXISTS "Permitir operações em roles" ON public.user_roles;

-- Create secure policies for user_roles
CREATE POLICY "Admins can manage user_roles" ON public.user_roles
FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM inscricoes_mentoria im
    WHERE im.id = user_roles.user_id
    AND im.email = (auth.jwt() ->> 'email')
    AND im.ativo = true
  )
);

-- ============================================================================
-- 3. FIX USER_ADMIN TABLE EXPOSURE
-- ============================================================================

-- Drop public SELECT policy on user_admin
DROP POLICY IF EXISTS "Permitir leitura de administradores para verificação" ON public.user_admin;

-- Create admin-only policy for user_admin
CREATE POLICY "Only admins can access user_admin" ON public.user_admin
FOR SELECT USING (is_admin_user());

-- ============================================================================
-- 4. FIX INSCRICOES_CURSOS PERMISSIVE POLICY
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "Acesso total inscricoes curso" ON public.inscricoes_cursos;

-- Keep existing secure policies (they are already proper)

-- ============================================================================
-- 5. SECURE COURSE_BANNERS
-- ============================================================================

-- Drop duplicate and permissive policies on course_banners
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON public.course_banners;
DROP POLICY IF EXISTS "Permitir exclusão para usuários autenticados" ON public.course_banners;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON public.course_banners;
DROP POLICY IF EXISTS "anon_insert_course_banners" ON public.course_banners;
DROP POLICY IF EXISTS "anon_update_course_banners" ON public.course_banners;
DROP POLICY IF EXISTS "authenticated_insert_course_banners" ON public.course_banners;
DROP POLICY IF EXISTS "authenticated_update_course_banners" ON public.course_banners;

-- Create secure policies for course_banners
CREATE POLICY "Admins can manage course_banners" ON public.course_banners
FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

-- Keep public SELECT policies for banners (they are needed for display)

-- ============================================================================
-- 6. SECURE ADMIN_ACTION_TOKENS
-- ============================================================================

-- Drop permissive policy
DROP POLICY IF EXISTS "Admins podem gerenciar tokens de ação" ON public.admin_action_tokens;

-- Create admin-only policy
CREATE POLICY "Only admins can manage action tokens" ON public.admin_action_tokens
FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user());

-- ============================================================================
-- 7. REMOVE HARDCODED API KEY FUNCTION (CRITICAL SECURITY ISSUE)
-- ============================================================================

-- Drop the function that contains hardcoded Resend API key
DROP FUNCTION IF EXISTS public.send_test_email(text, text, text);

-- ============================================================================
-- 8. HARDEN SECURITY DEFINER FUNCTIONS
-- ============================================================================

-- Update critical SECURITY DEFINER functions to set proper search_path
CREATE OR REPLACE FUNCTION public.email_exists_for_recovery(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar diretamente na tabela auth.users
  RETURN EXISTS(
    SELECT 1 FROM auth.users 
    WHERE email = email_to_check
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.inscricoes_mentoria im
    JOIN public.user_roles ur ON ur.user_id = im.id
    WHERE im.email = (auth.jwt() ->> 'email')
    AND ur.role = 'admin' 
    AND ur.active = TRUE
    AND im.ativo = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email text)
RETURNS TABLE(id uuid, email text, senha_hash text, ativo boolean, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    im.id,
    im.email,
    im.senha_hash,
    im.ativo,
    im.status
  FROM public.inscricoes_mentoria im
  WHERE im.email = user_email AND im.ativo = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_user_role(user_email text, required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.inscricoes_mentoria im
    JOIN public.user_roles ur ON ur.user_id = im.id
    WHERE im.email = user_email 
    AND ur.role = required_role 
    AND ur.active = TRUE
    AND im.ativo = TRUE
  );
END;
$$;

-- ============================================================================
-- 9. REMOVE/SECURE DANGEROUS FUNCTIONS
-- ============================================================================

-- Revoke execute permissions on dangerous functions from PUBLIC
REVOKE EXECUTE ON FUNCTION public.criar_conta_auth_segura(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.criar_conta_auth_para_inscrito(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.backfill_auth_accounts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_first_admin(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.call_edge_function(text, jsonb) FROM PUBLIC;

-- ============================================================================
-- 10. CLEAN UP DEMO TABLE
-- ============================================================================

-- Drop the demo table with permissive policies
DROP TABLE IF EXISTS public.nome_da_tabela;

-- ============================================================================
-- 11. SECURE STORAGE BUCKETS
-- ============================================================================

-- Make sensitive storage buckets private
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('certificados', 'modulo-materiais');

-- Create secure storage policies for certificados bucket
CREATE POLICY "Admins can manage certificados files" ON storage.objects
FOR ALL USING (
  bucket_id = 'certificados' 
  AND is_admin_user()
) WITH CHECK (
  bucket_id = 'certificados' 
  AND is_admin_user()
);

CREATE POLICY "Users can view their own certificados files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'certificados'
  AND EXISTS (
    SELECT 1 FROM certificados_conclusao cc
    JOIN inscricoes_cursos ic ON ic.id = cc.inscricao_curso_id
    JOIN inscricoes_mentoria im ON im.id = ic.aluno_id
    WHERE im.email = (auth.jwt() ->> 'email')
    AND im.ativo = true
    AND cc.certificado_pdf IS NOT NULL
    AND name LIKE '%' || cc.numero_certificado || '%'
  )
);

-- Create secure storage policies for modulo-materiais bucket
CREATE POLICY "Admins can manage modulo materiais files" ON storage.objects
FOR ALL USING (
  bucket_id = 'modulo-materiais' 
  AND is_admin_user()
) WITH CHECK (
  bucket_id = 'modulo-materiais' 
  AND is_admin_user()
);

CREATE POLICY "Enrolled users can view modulo materiais files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'modulo-materiais'
  AND EXISTS (
    SELECT 1 FROM modulo_materiais mm
    JOIN curso_modulos cm ON cm.id = mm.modulo_id
    JOIN inscricoes_cursos ic ON ic.curso_id = cm.curso_id
    JOIN inscricoes_mentoria im ON im.id = ic.aluno_id
    WHERE im.email = (auth.jwt() ->> 'email')
    AND im.ativo = true
    AND ic.status = 'aprovado'
    AND mm.ativo = true
    AND (mm.url IS NOT NULL AND name = split_part(mm.url, '/', -1))
  )
);