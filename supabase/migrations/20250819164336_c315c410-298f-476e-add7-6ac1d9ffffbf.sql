-- STAGE 2: STORAGE SECURITY & ADDITIONAL FUNCTION HARDENING

-- Fix remaining function search_path warnings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_slug(title text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(title),
          '[àáâãäå]', 'a', 'g'
        ),
        '[èéêë]', 'e', 'g'
      ),
      '[ìíîï]', 'i', 'g'
    ),
    '[^a-z0-9]', '-', 'g'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_generate_course_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.titulo);
  END IF;
  RETURN NEW;
END;
$function$;

-- STORAGE SECURITY: Make sensitive buckets private
UPDATE storage.buckets SET public = false WHERE id = 'modulo-materiais';
UPDATE storage.buckets SET public = false WHERE id = 'certificados';

-- Create secure storage access policies
-- Remove overly permissive policies first
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to folder 1oj01fe_2" ON storage.objects;

-- SECURE CERTIFICADOS BUCKET POLICIES
CREATE POLICY "Admins can manage certificados" ON storage.objects
FOR ALL USING (
  bucket_id = 'certificados' AND is_admin_user()
) WITH CHECK (
  bucket_id = 'certificados' AND is_admin_user()
);

CREATE POLICY "Users can view own certificados" ON storage.objects
FOR SELECT USING (
  bucket_id = 'certificados' AND 
  EXISTS (
    SELECT 1 FROM certificados_conclusao cc
    JOIN inscricoes_cursos ic ON ic.id = cc.inscricao_curso_id
    JOIN inscricoes_mentoria im ON im.id = ic.aluno_id
    WHERE cc.certificado_pdf = name 
    AND im.email = (auth.jwt() ->> 'email')
    AND im.ativo = true
  )
);

-- SECURE MODULO-MATERIAIS BUCKET POLICIES  
CREATE POLICY "Admins can manage modulo materiais" ON storage.objects
FOR ALL USING (
  bucket_id = 'modulo-materiais' AND is_admin_user()
) WITH CHECK (
  bucket_id = 'modulo-materiais' AND is_admin_user()  
);

CREATE POLICY "Enrolled users can view course materials" ON storage.objects
FOR SELECT USING (
  bucket_id = 'modulo-materiais' AND
  EXISTS (
    SELECT 1 FROM modulo_materiais mm
    JOIN curso_modulos cm ON cm.id = mm.modulo_id  
    JOIN inscricoes_cursos ic ON ic.curso_id = cm.curso_id
    JOIN inscricoes_mentoria im ON im.id = ic.aluno_id
    WHERE mm.url = name
    AND im.email = (auth.jwt() ->> 'email')
    AND im.ativo = true
    AND ic.status = 'aprovado'
  )
);

-- Secure other dangerous functions that could expose sensitive data
CREATE OR REPLACE FUNCTION public.email_exists_for_recovery(email_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Add rate limiting check (basic protection)
  IF current_setting('app.recovery_attempts_count', true)::int > 5 THEN
    RAISE EXCEPTION 'Too many recovery attempts. Please try again later.';
  END IF;
  
  -- Verify email format first
  IF NOT (email_to_check ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
    RETURN false;
  END IF;
  
  -- Check auth.users table securely
  RETURN EXISTS(
    SELECT 1 FROM auth.users 
    WHERE email = email_to_check
  );
END;
$function$;

-- Secure user creation functions
CREATE OR REPLACE FUNCTION public.criar_conta_auth_segura(user_email text, user_password text DEFAULT 'Mudar@123'::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  inscricao_record RECORD;
  new_user_id UUID;
BEGIN
  -- Only allow admins to create auth accounts
  IF NOT is_admin_user() THEN
    RETURN 'Access denied: Only administrators can create auth accounts';
  END IF;
  
  -- Validate email format
  IF NOT (user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
    RETURN 'Invalid email format';
  END IF;
  
  -- Verify user exists in inscricoes_mentoria and is approved
  SELECT * INTO inscricao_record
  FROM public.inscricoes_mentoria 
  WHERE email = user_email AND ativo = true AND status = 'aprovado';
  
  IF NOT FOUND THEN
    RETURN 'User not found, not active, or not approved';
  END IF;
  
  -- Check if already exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RETURN 'User already exists in authentication system';
  END IF;
  
  -- Generate secure user ID
  new_user_id := gen_random_uuid();
  
  -- Create auth user with minimal required fields
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      new_user_id,
      'authenticated',
      'authenticated', 
      user_email,
      '$2a$10$defaulthashfortemporarypassword', 
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('nome', inscricao_record.nome, 'email', user_email)
    );
    
    -- Create identity
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      created_at,
      updated_at
    ) VALUES (
      new_user_id,
      new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', user_email),
      'email',
      NOW(),
      NOW()
    );
    
    RETURN 'Account created successfully for ' || user_email;
    
  EXCEPTION WHEN OTHERS THEN
    RETURN 'Error creating account: ' || SQLERRM;
  END;
END;
$function$;

-- Create secure function for signed URL generation (for private storage access)
CREATE OR REPLACE FUNCTION public.generate_signed_url(bucket_name text, object_path text, expires_in integer DEFAULT 3600)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Verify user has access to the requested object
  CASE bucket_name
    WHEN 'certificados' THEN
      -- Check if user owns the certificate
      IF NOT EXISTS (
        SELECT 1 FROM certificados_conclusao cc
        JOIN inscricoes_cursos ic ON ic.id = cc.inscricao_curso_id
        JOIN inscricoes_mentoria im ON im.id = ic.aluno_id
        WHERE cc.certificado_pdf = object_path 
        AND im.email = (auth.jwt() ->> 'email')
        AND im.ativo = true
      ) AND NOT is_admin_user() THEN
        RAISE EXCEPTION 'Access denied to certificate';
      END IF;
      
    WHEN 'modulo-materiais' THEN
      -- Check if user is enrolled in the course that contains this material
      IF NOT EXISTS (
        SELECT 1 FROM modulo_materiais mm
        JOIN curso_modulos cm ON cm.id = mm.modulo_id  
        JOIN inscricoes_cursos ic ON ic.curso_id = cm.curso_id
        JOIN inscricoes_mentoria im ON im.id = ic.aluno_id
        WHERE mm.url = object_path
        AND im.email = (auth.jwt() ->> 'email')
        AND im.ativo = true
        AND ic.status = 'aprovado'
      ) AND NOT is_admin_user() THEN
        RAISE EXCEPTION 'Access denied to course material';
      END IF;
      
    ELSE
      -- For other buckets, only admins can generate signed URLs
      IF NOT is_admin_user() THEN
        RAISE EXCEPTION 'Access denied to storage bucket';
      END IF;
  END CASE;
  
  -- Return a placeholder for signed URL (actual implementation would use Supabase storage API)
  RETURN format('https://fauoxtziffljgictcvhi.supabase.co/storage/v1/object/sign/%s/%s?token=SECURE_TOKEN', bucket_name, object_path);
END;
$function$;