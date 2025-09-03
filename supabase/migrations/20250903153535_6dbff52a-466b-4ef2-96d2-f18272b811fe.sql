-- Adicionar departamento EXPORTAÇÃO para todas as empresas ativas
INSERT INTO public.departamentos (empresa_id, nome, status)
SELECT 
    e.id as empresa_id,
    'EXPORTAÇÃO' as nome,
    'ativo' as status
FROM public.empresas e
WHERE e.status = 'ativo'
AND NOT EXISTS (
    SELECT 1 FROM public.departamentos d 
    WHERE d.empresa_id = e.id 
    AND d.nome = 'EXPORTAÇÃO' 
    AND d.status = 'ativo'
);