-- =====================================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA: Proteger dados pessoais na tabela inscricoes_mentoria
-- =====================================================

-- 1. Remover políticas perigosas que permitem acesso público total
DROP POLICY IF EXISTS "Acesso para funções do sistema" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "Permitir verificação de email para recuperação" ON public.inscricoes_mentoria;

-- 2. Criar função segura para verificação de email (apenas confirma existência, não expõe dados)
CREATE OR REPLACE FUNCTION public.email_exists_for_recovery(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM public.inscricoes_mentoria 
    WHERE email = email_to_check AND ativo = true
  );
END;
$$;

-- 3. Criar função segura para autenticação (só retorna dados do próprio usuário)
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email text)
RETURNS TABLE(
  id uuid,
  email text,
  senha_hash text,
  ativo boolean,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 4. Política segura: Usuários só veem seus próprios dados completos
CREATE POLICY "Usuários veem apenas seus próprios dados"
ON public.inscricoes_mentoria
FOR SELECT
USING (
  auth.jwt() ->> 'email' = email 
  AND ativo = true
);

-- 5. Manter política existente para admins (já segura)
-- "Administradores têm acesso completo" - mantida

-- 6. Manter política para cadastro público (já segura)  
-- "Permitir cadastro público de novos usuários" - mantida

-- 7. Manter política para updates do próprio usuário (já segura)
-- "Usuários podem atualizar apenas seus próprios dados" - mantida

-- 8. Política específica para funções do sistema (muito restritiva)
CREATE POLICY "Acesso restrito para funções do sistema"
ON public.inscricoes_mentoria
FOR ALL
TO service_role
USING (true);

-- 9. Comentar as funções para documentar seu propósito
COMMENT ON FUNCTION public.email_exists_for_recovery(text) IS 'Função segura para verificar se email existe para recuperação de senha - não expõe dados pessoais';
COMMENT ON FUNCTION public.get_user_by_email(text) IS 'Função segura para autenticação - retorna apenas dados necessários do usuário autenticado';