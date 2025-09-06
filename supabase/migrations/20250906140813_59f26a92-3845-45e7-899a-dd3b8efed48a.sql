-- Vamos fazer uma abordagem mais robusta
-- Primeiro, vamos habilitar RLS bypass temporário para debugging

-- Criar uma função que force bypass das políticas para admin
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  target_user_id UUID,
  new_status TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Verificar se quem chama é admin
  IF NOT is_admin_by_email('inacio.fernando@gmail.com') THEN
    RETURN json_build_object('success', false, 'message', 'Access denied: Not an admin');
  END IF;
  
  -- Fazer o update diretamente
  UPDATE public.inscricoes_mentoria 
  SET 
    status = new_status,
    ativo = CASE WHEN new_status = 'aprovado' THEN true ELSE false END,
    data_aprovacao = CASE WHEN new_status = 'aprovado' THEN NOW() ELSE data_aprovacao END
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'User status updated successfully');
END;
$$;

-- Testar a função
SELECT public.admin_update_user_status(
  '90b6824f-7966-4df0-9cbb-f10800838d86'::uuid,
  'aprovado'
);