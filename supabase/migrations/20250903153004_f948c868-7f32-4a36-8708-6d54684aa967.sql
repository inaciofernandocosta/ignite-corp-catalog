-- Desativar departamentos não desejados
UPDATE public.departamentos 
SET status = 'inativo'
WHERE nome IN ('ADICIONAR', 'TI', 'DP', 'Departamento Pessoal') 
AND status = 'ativo';