-- Atualizar função para verificar em auth.users em vez de inscricoes_mentoria
CREATE OR REPLACE FUNCTION public.email_exists_for_recovery(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar diretamente na tabela auth.users
  RETURN EXISTS(
    SELECT 1 FROM auth.users 
    WHERE email = email_to_check
  );
END;
$$;