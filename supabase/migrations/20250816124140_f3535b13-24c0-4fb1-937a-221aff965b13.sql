-- Verificar e habilitar RLS em tabelas que não têm
ALTER TABLE public.admin_action_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nome_da_tabela ENABLE ROW LEVEL SECURITY;

-- Criar política para admin_action_tokens
CREATE POLICY "Admins podem gerenciar tokens de ação" 
ON public.admin_action_tokens 
FOR ALL 
USING (true)
WITH CHECK (true);