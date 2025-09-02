-- Fix confirmation_token NULL issue for Mariana's account
-- When confirmation_token is NULL but email is confirmed, set it to empty string
UPDATE auth.users 
SET confirmation_token = ''
WHERE email = 'mariana.tavares@vilanova.com.br' 
AND confirmation_token IS NULL 
AND email_confirmed_at IS NOT NULL;