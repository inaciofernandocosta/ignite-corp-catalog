-- Limpar todas as políticas RLS duplicadas da tabela inscricoes_mentoria
DROP POLICY IF EXISTS "Administradores têm acesso completo" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "Admins can manage all inscricoes" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "Allow public registration" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "Authenticated users can view their own inscricao" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "Users can view own profile only" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "Usuários podem atualizar apenas seus próprios dados" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "Usuários veem apenas seus próprios dados" ON public.inscricoes_mentoria;

-- Criar políticas RLS limpas e funcionais para inscricoes_mentoria
-- 1. Permitir registro público (sem autenticação)
CREATE POLICY "public_insert_inscricoes"
ON public.inscricoes_mentoria
FOR INSERT
WITH CHECK (status = 'pendente' AND ativo = false);

-- 2. Admins podem fazer tudo
CREATE POLICY "admin_full_access_inscricoes"
ON public.inscricoes_mentoria
FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 3. Usuários autenticados podem ver seus próprios dados (se ativos)
CREATE POLICY "users_read_own_inscricoes"
ON public.inscricoes_mentoria
FOR SELECT
USING (
  (auth.jwt() ->> 'email') = email 
  AND ativo = true
);

-- 4. Usuários autenticados podem atualizar seus próprios dados (se ativos)
CREATE POLICY "users_update_own_inscricoes"
ON public.inscricoes_mentoria
FOR UPDATE
USING (
  (auth.jwt() ->> 'email') = email 
  AND ativo = true
)
WITH CHECK (
  (auth.jwt() ->> 'email') = email 
  AND ativo = true
);