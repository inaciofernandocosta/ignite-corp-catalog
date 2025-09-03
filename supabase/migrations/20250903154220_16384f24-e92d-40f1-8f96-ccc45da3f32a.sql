-- Corrigir o trigger para não interferir em inserções públicas
CREATE OR REPLACE FUNCTION public.ensure_approved_users_active()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se o status está sendo alterado para 'aprovado', garantir que ativo seja true
  -- Mas apenas em UPDATEs, não em INSERTs
  IF TG_OP = 'UPDATE' AND NEW.status = 'aprovado' AND OLD.status != 'aprovado' THEN
    NEW.ativo = true;
    NEW.data_aprovacao = COALESCE(NEW.data_aprovacao, NOW());
  END IF;
  
  RETURN NEW;
END;
$function$;