-- Função para deletar usuário completamente (auth + dados relacionados)
CREATE OR REPLACE FUNCTION public.delete_user_completely(user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  auth_user_id UUID;
  inscricao_user_id UUID;
BEGIN
  -- Only admins can delete users completely
  IF NOT is_admin_user() THEN
    RETURN 'Access denied: Only administrators can delete users';
  END IF;
  
  -- Validate email format
  IF NOT (user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
    RETURN 'Invalid email format';
  END IF;
  
  -- Get user IDs
  SELECT id INTO auth_user_id FROM auth.users WHERE email = user_email;
  SELECT id INTO inscricao_user_id FROM public.inscricoes_mentoria WHERE email = user_email;
  
  -- Delete from user_roles if exists
  DELETE FROM public.user_roles WHERE user_id = inscricao_user_id;
  
  -- Delete from inscricoes_cursos if exists
  DELETE FROM public.inscricoes_cursos WHERE aluno_id = inscricao_user_id;
  
  -- Delete from inscricoes_mentoria
  DELETE FROM public.inscricoes_mentoria WHERE email = user_email;
  
  -- Delete from auth.identities first
  DELETE FROM auth.identities WHERE user_id = auth_user_id;
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE email = user_email;
  
  RETURN 'User deleted successfully: ' || user_email;
  
EXCEPTION WHEN OTHERS THEN
  RETURN 'Error deleting user: ' || SQLERRM;
END;
$$;

-- Deletar a Mariana completamente
SELECT delete_user_completely('mariana.tavares@vilanova.com.br');