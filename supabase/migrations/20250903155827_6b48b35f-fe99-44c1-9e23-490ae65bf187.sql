-- LIMPAR COMPLETAMENTE todas as políticas RLS existentes
-- Primeiro ver quais políticas existem e dropar TODAS

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Dropar todas as políticas existentes na tabela inscricoes_mentoria
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'inscricoes_mentoria' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.inscricoes_mentoria', policy_record.policyname);
    END LOOP;
END $$;

-- Agora criar função completamente isolada para admin
CREATE OR REPLACE FUNCTION public.check_admin_role()
RETURNS boolean
LANGUAGE plpgsql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  is_admin_result boolean := false;
BEGIN
  -- Obter email do usuário autenticado
  SELECT users.email INTO user_email
  FROM auth.users users
  WHERE users.id = auth.uid();
  
  -- Se não tem email, não é admin
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se é admin usando apenas user_roles
  -- SEM consultar inscricoes_mentoria
  SELECT EXISTS(
    SELECT 1 
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()::text::uuid
    AND ur.role = 'admin' 
    AND ur.active = true
  ) INTO is_admin_result;
  
  RETURN is_admin_result;
END;
$$;

-- Criar políticas SUPER SIMPLES sem recursão
-- Para INSERT: sempre permitir (cadastros públicos)
CREATE POLICY "allow_all_inserts" ON public.inscricoes_mentoria
  FOR INSERT 
  WITH CHECK (true);

-- Para SELECT: apenas próprios dados ou admin
CREATE POLICY "select_own_or_admin" ON public.inscricoes_mentoria
  FOR SELECT
  USING (
    -- Admin pode ver tudo
    check_admin_role() = true
    OR
    -- Usuário pode ver seus próprios dados
    (
      email = (SELECT users.email FROM auth.users users WHERE users.id = auth.uid())
      AND ativo = true
    )
  );

-- Para UPDATE: apenas próprios dados ou admin  
CREATE POLICY "update_own_or_admin" ON public.inscricoes_mentoria
  FOR UPDATE
  USING (
    -- Admin pode atualizar tudo
    check_admin_role() = true
    OR
    -- Usuário pode atualizar seus próprios dados
    (
      email = (SELECT users.email FROM auth.users users WHERE users.id = auth.uid())
      AND ativo = true
    )
  )
  WITH CHECK (
    -- Admin pode atualizar tudo
    check_admin_role() = true
    OR
    -- Usuário pode atualizar seus próprios dados
    (
      email = (SELECT users.email FROM auth.users users WHERE users.id = auth.uid())
      AND ativo = true
    )
  );

-- Para DELETE: apenas admin
CREATE POLICY "delete_admin_only" ON public.inscricoes_mentoria
  FOR DELETE
  USING (check_admin_role() = true);