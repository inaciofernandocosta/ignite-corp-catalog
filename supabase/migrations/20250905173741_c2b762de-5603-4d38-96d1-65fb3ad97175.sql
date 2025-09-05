-- Excluir o registro duplicado/inativo da Mariana Tavares
DELETE FROM public.inscricoes_mentoria 
WHERE id = 'd746d7de-d025-42aa-9a42-c3f82b5905f8';

-- Alterar o status do registro principal para reprovado
UPDATE public.inscricoes_mentoria 
SET status = 'reprovado', 
    ativo = false,
    data_aprovacao = NULL,
    updated_at = now()
WHERE id = 'd3f9db62-6381-4d77-ba0d-abbcc1ab18fd';