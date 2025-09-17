-- Criar tabela para rastrear acessos dos usuários
CREATE TABLE public.user_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  access_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_user_access_logs_email ON public.user_access_logs(user_email);
CREATE INDEX idx_user_access_logs_timestamp ON public.user_access_logs(access_timestamp);

-- Habilitar RLS
ALTER TABLE public.user_access_logs ENABLE ROW LEVEL SECURITY;

-- Política para admins gerenciarem logs de acesso
CREATE POLICY "Admins can manage access logs"
ON public.user_access_logs
FOR ALL
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Criar view para estatísticas de acesso dos usuários
CREATE OR REPLACE VIEW public.user_access_stats AS
SELECT 
  im.id,
  im.nome,
  im.email,
  im.empresa,
  im.departamento,
  im.status,
  im.ativo,
  im.created_at as data_inscricao,
  COUNT(ual.id) as total_acessos,
  MAX(ual.access_timestamp) as ultimo_acesso,
  MIN(ual.access_timestamp) as primeiro_acesso,
  CASE 
    WHEN COUNT(ual.id) = 0 THEN 'Nunca acessou'
    WHEN MAX(ual.access_timestamp) < NOW() - INTERVAL '30 days' THEN 'Inativo (30+ dias)'
    WHEN MAX(ual.access_timestamp) < NOW() - INTERVAL '7 days' THEN 'Pouco ativo (7+ dias)'
    ELSE 'Ativo'
  END as status_acesso
FROM public.inscricoes_mentoria im
LEFT JOIN public.user_access_logs ual ON ual.user_email = im.email
WHERE im.ativo = true AND im.status = 'aprovado'
GROUP BY im.id, im.nome, im.email, im.empresa, im.departamento, im.status, im.ativo, im.created_at
ORDER BY ultimo_acesso DESC NULLS LAST;

-- Política para admins lerem estatísticas de acesso
CREATE POLICY "Admins can view access stats"
ON public.user_access_stats
FOR SELECT
TO authenticated
USING (is_admin_user());