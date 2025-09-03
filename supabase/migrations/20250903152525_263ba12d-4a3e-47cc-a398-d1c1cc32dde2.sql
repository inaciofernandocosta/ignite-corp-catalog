-- Primeiro, alterar os nomes dos departamentos existentes
UPDATE public.departamentos 
SET nome = 'JURÍDICO'
WHERE nome = 'ADVOGADA' AND status = 'ativo';

UPDATE public.departamentos 
SET nome = 'CRÉDITO'
WHERE nome = 'COBRANÇA' AND status = 'ativo';

UPDATE public.departamentos 
SET nome = 'ASSISTENTE DE COMPRAS'
WHERE nome = 'COMPRAS' AND status = 'ativo';

UPDATE public.departamentos 
SET nome = 'RECURSOS HUMANOS'
WHERE nome = 'RH' AND status = 'ativo';

-- Excluir departamentos não desejados (marcando como inativo)
UPDATE public.departamentos 
SET status = 'inativo'
WHERE nome IN ('Departamento Pessoal', 'DP') AND status = 'ativo';

-- Adicionar novos departamentos para todas as empresas ativas
INSERT INTO public.departamentos (empresa_id, nome, status)
SELECT 
    e.id as empresa_id,
    dep.nome,
    'ativo' as status
FROM public.empresas e
CROSS JOIN (
    VALUES 
    ('CONTÁBIL'),
    ('SUPORTE (TI)'),
    ('DESENVOLVIMENTO (TI)'),
    ('INFRA (TI)'),
    ('ADM DE VENDAS'),
    ('TRANSPORTE'),
    ('ADICIONAR')
) AS dep(nome)
WHERE e.status = 'ativo'
AND NOT EXISTS (
    SELECT 1 FROM public.departamentos d 
    WHERE d.empresa_id = e.id 
    AND d.nome = dep.nome 
    AND d.status = 'ativo'
);