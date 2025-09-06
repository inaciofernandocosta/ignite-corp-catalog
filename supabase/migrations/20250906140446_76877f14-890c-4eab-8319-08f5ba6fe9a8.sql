-- Investigar e corrigir permissões de UPD ATE
-- O problema pode ser que não temos permissões básicas para a role authenticated

-- Verificar permissões atuais
SELECT grantee, privilege_type, is_grantable 
FROM information_schema.role_table_grants 
WHERE table_name IN ('inscricoes_mentoria', 'inscricoes_cursos')
AND table_schema = 'public';

-- Garantir que authenticated role tem permissões básicas
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inscricoes_mentoria TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inscricoes_cursos TO authenticated;

-- Também garantir para anon role caso necessário  
GRANT SELECT, INSERT ON public.inscricoes_mentoria TO anon;
GRANT SELECT, INSERT ON public.inscricoes_cursos TO anon;