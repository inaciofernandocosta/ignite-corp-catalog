-- Temporariamente desabilitar RLS completamente para teste
ALTER TABLE public.inscricoes_mentoria DISABLE ROW LEVEL SECURITY;

-- Testar se isso resolve o problema
-- Se resolver, sabemos que é um problema com as políticas RLS vs usuários anônimos

-- Depois vamos reativar com políticas corretas