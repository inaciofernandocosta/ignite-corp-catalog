-- Corrigir usuários aprovados que não estão ativos
UPDATE inscricoes_mentoria 
SET 
  ativo = true,
  data_aprovacao = COALESCE(data_aprovacao, NOW())
WHERE status = 'aprovado' AND ativo = false;

-- Criar trigger para garantir consistência futura
CREATE OR REPLACE FUNCTION ensure_approved_users_active()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status está sendo alterado para 'aprovado', garantir que ativo seja true
  IF NEW.status = 'aprovado' AND OLD.status != 'aprovado' THEN
    NEW.ativo = true;
    NEW.data_aprovacao = COALESCE(NEW.data_aprovacao, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger na tabela
DROP TRIGGER IF EXISTS trigger_ensure_approved_users_active ON inscricoes_mentoria;
CREATE TRIGGER trigger_ensure_approved_users_active
  BEFORE UPDATE ON inscricoes_mentoria
  FOR EACH ROW
  EXECUTE FUNCTION ensure_approved_users_active();