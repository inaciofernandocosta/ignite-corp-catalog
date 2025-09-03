-- Adicionar departamento COMPRADOR para todas as empresas ativas
INSERT INTO departamentos (empresa_id, nome, status)
SELECT id as empresa_id, 'COMPRADOR' as nome, 'ativo' as status
FROM empresas 
WHERE status = 'ativo'
AND NOT EXISTS (
  SELECT 1 FROM departamentos d 
  WHERE d.empresa_id = empresas.id 
  AND d.nome = 'COMPRADOR'
);