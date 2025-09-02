-- Deletar completamente a conta da Mariana para permitir novo cadastro
DO $$
BEGIN
  -- Deletar das identidades primeiro
  DELETE FROM auth.identities WHERE provider_id = 'mariana.tavares@vilanova.com.br';
  
  -- Deletar do auth.users
  DELETE FROM auth.users WHERE email = 'mariana.tavares@vilanova.com.br';
  
  -- Deletar da tabela de inscrições
  DELETE FROM public.inscricoes_mentoria WHERE email = 'mariana.tavares@vilanova.com.br';
  
  RAISE NOTICE 'Conta da Mariana deletada completamente - pronta para novo cadastro';
END $$;