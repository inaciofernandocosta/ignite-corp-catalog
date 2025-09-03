-- Criar política SELECT para dados recém inseridos (últimos 5 minutos)
-- Isso permite que o INSERT com .select() funcione
CREATE POLICY "select_recent_inserts" ON public.inscricoes_mentoria
  FOR SELECT 
  TO anon, authenticated
  USING (
    created_at >= NOW() - INTERVAL '5 minutes'
  );