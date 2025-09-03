-- Desativar departamento ADVOGADA
UPDATE public.departamentos 
SET status = 'inativo'
WHERE nome = 'ADVOGADA' 
AND status = 'ativo';