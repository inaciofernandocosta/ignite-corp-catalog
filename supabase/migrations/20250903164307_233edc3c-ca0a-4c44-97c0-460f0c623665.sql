-- Remover política temporária de leitura pública (por segurança)
DROP POLICY IF EXISTS "allow_anonymous_read_temp" ON public.inscricoes_mentoria;