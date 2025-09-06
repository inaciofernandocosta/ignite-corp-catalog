-- Corrigir trigger para usar API do Supabase em vez de inserção direta
DROP TRIGGER IF EXISTS trigger_auto_create_auth_account ON public.inscricoes_mentoria;

-- Nova função que usa a API do Supabase corretamente
CREATE OR REPLACE FUNCTION public.trigger_auto_create_auth_account_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_user_id UUID;
BEGIN
  -- Log para debug
  RAISE NOTICE 'TRIGGER V2: Executando para email %, status OLD: %, NEW: %', NEW.email, OLD.status, NEW.status;
  
  -- Só criar conta quando status muda para 'aprovado'
  IF (OLD IS NULL OR OLD.status != 'aprovado') AND NEW.status = 'aprovado' THEN
    -- Verificar se já existe conta no auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = NEW.email) THEN
      RAISE NOTICE 'TRIGGER V2: Criando conta auth para: %', NEW.email;
      
      -- Marcar para processamento posterior via Edge Function
      -- Em vez de inserir diretamente, vamos criar um token de ativação
      UPDATE public.inscricoes_mentoria 
      SET token_validacao = encode(gen_random_bytes(32), 'hex')
      WHERE id = NEW.id;
      
      RAISE NOTICE 'TRIGGER V2: Token de ativação criado para: %', NEW.email;
    ELSE
      RAISE NOTICE 'TRIGGER V2: Conta já existe para: %', NEW.email;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar novo trigger
CREATE TRIGGER trigger_auto_create_auth_account_v2
  AFTER INSERT OR UPDATE ON public.inscricoes_mentoria
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_create_auth_account_v2();

-- Limpar usuários auth corrompidos existentes (com senha temporária inválida)
DELETE FROM auth.identities 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE encrypted_password = '$2a$10$defaulthashfortemporarypassword'
);

DELETE FROM auth.users 
WHERE encrypted_password = '$2a$10$defaulthashfortemporarypassword';

-- Regenerar tokens de validação para usuários aprovados sem conta auth
UPDATE public.inscricoes_mentoria 
SET token_validacao = encode(gen_random_bytes(32), 'hex')
WHERE status = 'aprovado' 
AND ativo = true 
AND NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = inscricoes_mentoria.email
);