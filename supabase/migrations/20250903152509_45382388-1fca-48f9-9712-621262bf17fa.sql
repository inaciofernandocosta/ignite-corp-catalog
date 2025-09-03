-- Primeiro, verificar e alterar departamentos existentes apenas se o novo nome não existir
UPDATE public.departamentos 
SET nome = 'JURÍDICO'
WHERE nome = 'ADVOGADA' 
AND status = 'ativo'
AND NOT EXISTS (
    SELECT 1 FROM public.departamentos d2 
    WHERE d2.empresa_id = departamentos.empresa_id 
    AND d2.nome = 'JURÍDICO' 
    AND d2.status = 'ativo'
);

UPDATE public.departamentos 
SET nome = 'CRÉDITO'
WHERE nome = 'COBRANÇA' 
AND status = 'ativo'
AND NOT EXISTS (
    SELECT 1 FROM public.departamentos d2 
    WHERE d2.empresa_id = departamentos.empresa_id 
    AND d2.nome = 'CRÉDITO' 
    AND d2.status = 'ativo'
);

UPDATE public.departamentos 
SET nome = 'ASSISTENTE DE COMPRAS'
WHERE nome = 'COMPRAS' 
AND status = 'ativo'
AND NOT EXISTS (
    SELECT 1 FROM public.departamentos d2 
    WHERE d2.empresa_id = departamentos.empresa_id 
    AND d2.nome = 'ASSISTENTE DE COMPRAS' 
    AND d2.status = 'ativo'
);

UPDATE public.departamentos 
SET nome = 'RECURSOS HUMANOS'
WHERE nome = 'RH' 
AND status = 'ativo'
AND NOT EXISTS (
    SELECT 1 FROM public.departamentos d2 
    WHERE d2.empresa_id = departamentos.empresa_id 
    AND d2.nome = 'RECURSOS HUMANOS' 
    AND d2.status = 'ativo'
);

-- Desativar departamentos indesejados
UPDATE public.departamentos 
SET status = 'inativo'
WHERE nome IN ('Departamento Pessoal', 'DP') AND status = 'ativo';

-- Adicionar novos departamentos apenas se não existirem
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