-- STAGE 1: CRITICAL RLS LOCKDOWN & ACCESS CONTROL FIXES

-- 1. Lock down inscricoes_mentoria RLS policies (CRITICAL - currently allows anyone to modify data)
DROP POLICY IF EXISTS "Acesso restrito para funções do sistema" ON public.inscricoes_mentoria;
DROP POLICY IF EXISTS "Permitir cadastro público de novos usuários" ON public.inscricoes_mentoria;

-- Create secure RLS policies for inscricoes_mentoria
CREATE POLICY "Admins can manage all inscricoes" ON public.inscricoes_mentoria
FOR ALL USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Users can view own profile only" ON public.inscricoes_mentoria  
FOR SELECT USING (
  auth.jwt() ->> 'email' = email AND ativo = true
);

CREATE POLICY "Users can update own profile only" ON public.inscricoes_mentoria
FOR UPDATE USING (
  auth.jwt() ->> 'email' = email AND ativo = true
) WITH CHECK (
  auth.jwt() ->> 'email' = email AND ativo = true
);

-- Allow public registration (insert only, no updates after)
CREATE POLICY "Allow public registration" ON public.inscricoes_mentoria
FOR INSERT WITH CHECK (
  status = 'pendente' AND ativo = false
);

-- 2. Secure user_roles table (CRITICAL - prevents privilege escalation)
DROP POLICY IF EXISTS "Permitir leitura de roles para verificação de login" ON public.user_roles;

-- Only allow role queries through secure functions, not direct table access
CREATE POLICY "Only system functions can read roles" ON public.user_roles
FOR SELECT USING (false); -- Block all direct access

CREATE POLICY "Only admins can manage roles" ON public.user_roles  
FOR ALL USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 3. Secure departamentos, empresas, locais (remove overly permissive policies)
DROP POLICY IF EXISTS "Admins podem gerenciar departamentos" ON public.departamentos;
DROP POLICY IF EXISTS "Admins podem gerenciar empresas" ON public.empresas;  
DROP POLICY IF EXISTS "Admins podem gerenciar locais" ON public.locais;

CREATE POLICY "Only admins manage departamentos" ON public.departamentos
FOR ALL USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Only admins manage empresas" ON public.empresas
FOR ALL USING (is_admin_user()) 
WITH CHECK (is_admin_user());

CREATE POLICY "Only admins manage locais" ON public.locais
FOR ALL USING (is_admin_user())
WITH CHECK (is_admin_user());

-- 4. Secure user_admin table (CRITICAL - contains password hashes)
DROP POLICY IF EXISTS "Only admins can access user_admin" ON public.user_admin;

-- Completely block direct access to user_admin table
CREATE POLICY "Block all direct access to user_admin" ON public.user_admin
FOR ALL USING (false)
WITH CHECK (false);

-- 5. Remove hardcoded secrets from call_edge_function (CRITICAL SECURITY RISK)
CREATE OR REPLACE FUNCTION public.call_edge_function_secure(function_name text, payload jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  request_id bigint;
  auth_header text;
BEGIN
  -- Only allow admins to call edge functions
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Access denied: Only administrators can call edge functions';
  END IF;
  
  -- Get auth header from environment (no hardcoded secrets)
  auth_header := 'Bearer ' || current_setting('app.supabase_service_role_key', true);
  
  -- Validate function name (prevent injection)
  IF function_name !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'Invalid function name format';
  END IF;
  
  -- Use pg_net for secure async HTTP call
  SELECT INTO request_id net.http_post(
    url := 'https://fauoxtziffljgictcvhi.supabase.co/functions/v1/' || function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', auth_header
    ),
    body := payload
  );
  
  RAISE NOTICE 'Secure edge function call: % (request_id: %)', function_name, request_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Edge function call failed securely: %', SQLERRM;
END;
$function$;

-- Drop the old insecure function
DROP FUNCTION IF EXISTS public.call_edge_function(text, jsonb);

-- 6. Secure SECURITY DEFINER functions - add admin checks
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.inscricoes_mentoria im
    JOIN public.user_roles ur ON ur.user_id = im.id
    WHERE im.email = (auth.jwt() ->> 'email')
    AND ur.role = 'admin' 
    AND ur.active = TRUE
    AND im.ativo = TRUE
  );
$function$;

-- Secure the role checking functions
CREATE OR REPLACE FUNCTION public.check_user_role(user_email text, required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only allow self-check or admin access
  IF (auth.jwt() ->> 'email') != user_email AND NOT is_admin_user() THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 
    FROM public.inscricoes_mentoria im
    JOIN public.user_roles ur ON ur.user_id = im.id
    WHERE im.email = user_email 
    AND ur.role = required_role 
    AND ur.active = TRUE
    AND im.ativo = TRUE
  );
END;
$function$;

-- 7. Secure admin management functions
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email text, promoted_by_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  target_user_id UUID;
  promoter_user_id UUID;
  result JSON;
BEGIN
  -- Verify caller is admin AND matches promoted_by_email
  IF NOT is_admin_user() OR (auth.jwt() ->> 'email') != promoted_by_email THEN
    RETURN json_build_object('success', false, 'message', 'Access denied');
  END IF;
  
  -- Additional validation that promoter exists and is admin
  IF NOT check_user_role(promoted_by_email, 'admin') THEN
    RETURN json_build_object('success', false, 'message', 'Promoter is not an admin');
  END IF;
  
  -- Rest of function logic unchanged...
  SELECT id INTO target_user_id 
  FROM public.inscricoes_mentoria 
  WHERE email = user_email AND ativo = TRUE;
  
  IF target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;
  
  SELECT id INTO promoter_user_id 
  FROM public.inscricoes_mentoria 
  WHERE email = promoted_by_email;
  
  UPDATE public.user_roles 
  SET active = FALSE 
  WHERE user_id = target_user_id AND active = TRUE;
  
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (target_user_id, 'admin', promoter_user_id);
  
  RETURN json_build_object('success', true, 'message', 'User promoted successfully');
END;
$function$;