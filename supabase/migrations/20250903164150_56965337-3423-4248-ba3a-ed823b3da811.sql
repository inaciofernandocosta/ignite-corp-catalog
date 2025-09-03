-- Criar política temporária para permitir leitura pública (apenas para teste)
CREATE POLICY "allow_anonymous_read_temp" ON public.inscricoes_mentoria
  FOR SELECT 
  TO anon, authenticated
  USING (true);