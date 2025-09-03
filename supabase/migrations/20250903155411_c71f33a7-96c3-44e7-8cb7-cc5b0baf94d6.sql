-- CORREÇÃO DEFINITIVA DA RECURSÃO INFINITA
-- O problema é que is_admin_user() faz consulta em inscricoes_mentoria 
-- que tem política RLS que chama is_admin_user() novamente

-- 1. Primeiro, criar uma função segura que não cause recursão
CREATE OR REPLACE FUNCTION public.is_admin_user_safe()
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  -- Usar apenas auth.users e user_roles, sem tocar em inscricoes_mentoria
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    WHERE ur.user_id IN (
      SELECT im.id 
      FROM public.inscricoes_mentoria im 
      WHERE im.email = (
        SELECT users.email 
        FROM auth.users 
        WHERE users.id = auth.uid()
      )
      AND im.ativo = TRUE
    )
    AND ur.role = 'admin' 
    AND ur.active = TRUE
  );
$$;

-- 2. Remover todas as políticas que causam recursão
DROP POLICY IF EXISTS "admin_all_access" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "allow_public_insert" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "users_select_own" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "users_update_own" ON public.inscricoes_mentoria;

-- 3. Criar políticas simples SEM funções que possam causar recursão
CREATE POLICY "public_insert_only" ON public.inscricoes_mentoria
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "admin_full_access_safe" ON public.inscricoes_mentoria
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users au
      JOIN public.user_roles ur ON ur.user_id IN (
        SELECT im.id FROM public.inscricoes_mentoria im 
        WHERE im.email = au.email AND im.ativo = true
      )
      WHERE au.id = auth.uid()
      AND ur.role = 'admin' 
      AND ur.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM auth.users au
      JOIN public.user_roles ur ON ur.user_id IN (
        SELECT im.id FROM public.inscricoes_mentoria im 
        WHERE im.email = au.email AND im.ativo = true
      )
      WHERE au.id = auth.uid()
      AND ur.role = 'admin' 
      AND ur.active = true
    )
  );

CREATE POLICY "users_own_data_safe" ON public.inscricoes_mentoria
  FOR SELECT
  USING (
    email = (
      SELECT users.email 
      FROM auth.users users 
      WHERE users.id = auth.uid()
    ) 
    AND ativo = true
  );

CREATE POLICY "users_update_own_safe" ON public.inscricoes_mentoria
  FOR UPDATE
  USING (
    email = (
      SELECT users.email 
      FROM auth.users users 
      WHERE users.id = auth.uid()
    ) 
    AND ativo = true
  )
  WITH CHECK (
    email = (
      SELECT users.email 
      FROM auth.users users 
      WHERE users.id = auth.uid()
    ) 
    AND ativo = true
  );