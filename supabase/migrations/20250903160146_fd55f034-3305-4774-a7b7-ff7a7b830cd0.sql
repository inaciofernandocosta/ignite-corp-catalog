-- Limpar TODAS as políticas e criar versão super simples
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Dropar todas as políticas existentes
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'inscricoes_mentoria' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.inscricoes_mentoria', policy_record.policyname);
    END LOOP;
END $$;

-- Dropar função atual
DROP FUNCTION IF EXISTS public.check_admin_role();

-- Criar função super simples para admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND active = true
  );
$$;

-- Política SUPER SIMPLES para INSERT - permitir tudo
CREATE POLICY "public_can_insert" ON public.inscricoes_mentoria
  FOR INSERT 
  WITH CHECK (true);

-- Política simples para SELECT - admin vê tudo, usuário vê próprios dados
CREATE POLICY "view_own_or_admin" ON public.inscricoes_mentoria
  FOR SELECT
  USING (
    is_admin_user() = true
    OR
    email = (auth.jwt() ->> 'email')
  );

-- Política simples para UPDATE - admin vê tudo, usuário vê próprios dados  
CREATE POLICY "update_own_or_admin" ON public.inscricoes_mentoria
  FOR UPDATE
  USING (
    is_admin_user() = true
    OR
    email = (auth.jwt() ->> 'email')
  )
  WITH CHECK (
    is_admin_user() = true
    OR
    email = (auth.jwt() ->> 'email')
  );

-- Política para DELETE - apenas admin
CREATE POLICY "admin_delete_only" ON public.inscricoes_mentoria
  FOR DELETE
  USING (is_admin_user() = true);

-- Garantir que RLS está habilitado
ALTER TABLE public.inscricoes_mentoria ENABLE ROW LEVEL SECURITY;