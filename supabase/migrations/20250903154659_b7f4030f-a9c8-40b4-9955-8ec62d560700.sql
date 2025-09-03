-- Remover todas as políticas antigas da tabela inscricoes_mentoria
DROP POLICY IF EXISTS "public_insert_inscricoes" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "admin_full_access_inscricoes" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "users_read_own_inscricoes" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "users_update_own_inscricoes" ON public.inscricoes_mentoria;

-- Reabilitar RLS
ALTER TABLE public.inscricoes_mentoria ENABLE ROW LEVEL SECURITY;

-- Criar políticas mais simples e funcionais
-- 1. Permitir inserções públicas (cadastros)
CREATE POLICY "allow_public_insert" ON public.inscricoes_mentoria
  FOR INSERT 
  WITH CHECK (true);

-- 2. Permitir que usuários vejam apenas seus próprios dados quando autenticados
CREATE POLICY "users_select_own" ON public.inscricoes_mentoria
  FOR SELECT 
  USING (auth.jwt() ->> 'email' = email AND ativo = true);

-- 3. Permitir que usuários atualizem apenas seus próprios dados quando autenticados
CREATE POLICY "users_update_own" ON public.inscricoes_mentoria
  FOR UPDATE 
  USING (auth.jwt() ->> 'email' = email AND ativo = true)
  WITH CHECK (auth.jwt() ->> 'email' = email AND ativo = true);

-- 4. Permitir que admins façam tudo (mas sem recursão)
CREATE POLICY "admin_all_access" ON public.inscricoes_mentoria
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      JOIN auth.users au ON au.id::text = ur.user_id::text
      WHERE au.email = (auth.jwt() ->> 'email')
      AND ur.role = 'admin' 
      AND ur.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      JOIN auth.users au ON au.id::text = ur.user_id::text
      WHERE au.email = (auth.jwt() ->> 'email')
      AND ur.role = 'admin' 
      AND ur.active = true
    )
  );