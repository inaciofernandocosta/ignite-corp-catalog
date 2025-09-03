-- Primeiro, vamos limpar os departamentos existentes das outras empresas
DELETE FROM departamentos 
WHERE empresa_id IN (
  '734b34dc-1838-4adf-8f5b-b87ae5ea6658', -- Focomix
  'b2758a2d-1ebc-480b-96b7-a4f6e04d5882', -- Transvila
  '77c1ae8e-d24b-4f48-8f7e-17e5c91b8b6d'  -- V2
);

-- Agora vamos replicar os departamentos da Vila Nova para as outras empresas
-- Focomix
INSERT INTO departamentos (empresa_id, nome, status)
SELECT '734b34dc-1838-4adf-8f5b-b87ae5ea6658' as empresa_id, nome, 'ativo' as status
FROM departamentos 
WHERE empresa_id = '655b266b-0f04-4353-9af5-e6ecd642346b' 
AND status = 'ativo';

-- Transvila
INSERT INTO departamentos (empresa_id, nome, status)
SELECT 'b2758a2d-1ebc-480b-96b7-a4f6e04d5882' as empresa_id, nome, 'ativo' as status
FROM departamentos 
WHERE empresa_id = '655b266b-0f04-4353-9af5-e6ecd642346b' 
AND status = 'ativo';

-- V2
INSERT INTO departamentos (empresa_id, nome, status)
SELECT '77c1ae8e-d24b-4f48-8f7e-17e5c91b8b6d' as empresa_id, nome, 'ativo' as status
FROM departamentos 
WHERE empresa_id = '655b266b-0f04-4353-9af5-e6ecd642346b' 
AND status = 'ativo';