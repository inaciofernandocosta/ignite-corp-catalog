-- Atualizar a senha do usuário no sistema de autenticação
UPDATE auth.users 
SET encrypted_password = crypt('admin123', gen_salt('bf')),
    updated_at = now()
WHERE email = 'inacio.fernando@gmail.com';