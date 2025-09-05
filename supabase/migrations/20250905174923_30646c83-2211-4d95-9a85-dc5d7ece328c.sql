-- Reprovar completamente o cadastro da Mariana Tavares
-- Alterar status das inscrições em cursos para reprovado
UPDATE public.inscricoes_cursos 
SET status = 'reprovado'
WHERE aluno_id = 'd3f9db62-6381-4d77-ba0d-abbcc1ab18fd';

-- Confirmar que o registro principal está reprovado e inativo
UPDATE public.inscricoes_mentoria 
SET status = 'reprovado', 
    ativo = false,
    data_aprovacao = NULL
WHERE id = 'd3f9db62-6381-4d77-ba0d-abbcc1ab18fd';