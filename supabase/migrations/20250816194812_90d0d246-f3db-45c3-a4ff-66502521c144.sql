-- Fix critical security vulnerability in inscricoes_mentoria table
-- Current policy allows public access to sensitive employee data

-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Acesso total inscricoes mentoria" ON public.inscricoes_mentoria;

-- Create secure RLS policies with proper access control

-- 1. Allow public signup (insert only for new registrations)
CREATE POLICY "Permitir cadastro público de novos usuários"
ON public.inscricoes_mentoria
FOR INSERT
TO public
WITH CHECK (true);

-- 2. Allow users to read only their own registration data when authenticated
CREATE POLICY "Usuários podem ver apenas seus próprios dados"
ON public.inscricoes_mentoria
FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = email);

-- 3. Allow users to update only their own registration data when authenticated
CREATE POLICY "Usuários podem atualizar apenas seus próprios dados"
ON public.inscricoes_mentoria
FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = email)
WITH CHECK (auth.jwt() ->> 'email' = email);

-- 4. Create a security definer function to check admin role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.inscricoes_mentoria im
    JOIN public.user_roles ur ON ur.user_id = im.id
    WHERE im.email = (auth.jwt() ->> 'email')
    AND ur.role = 'admin' 
    AND ur.active = TRUE
    AND im.ativo = TRUE
  );
$$;

-- 5. Allow admins to have full access for management purposes
CREATE POLICY "Administradores têm acesso completo"
ON public.inscricoes_mentoria
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- 6. Allow system functions to access data (for triggers and internal operations)
CREATE POLICY "Acesso para funções do sistema"
ON public.inscricoes_mentoria
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);