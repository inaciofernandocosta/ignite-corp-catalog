-- Criar tabela para mapear cargos disponíveis por departamento e empresa
CREATE TABLE IF NOT EXISTS public.cargos_departamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  departamento_id UUID NOT NULL,
  cargo_nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, departamento_id, cargo_nome)
);

-- Enable RLS
ALTER TABLE public.cargos_departamento ENABLE ROW LEVEL SECURITY;

-- Policy para admins gerenciarem cargos
CREATE POLICY "Admins can manage cargos_departamento" 
ON public.cargos_departamento 
FOR ALL 
USING (is_admin_user()) 
WITH CHECK (is_admin_user());

-- Policy para leitura pública de cargos ativos
CREATE POLICY "Permitir leitura pública de cargos ativos" 
ON public.cargos_departamento 
FOR SELECT 
USING (ativo = true);

-- Adicionar trigger para updated_at
CREATE TRIGGER update_cargos_departamento_updated_at
  BEFORE UPDATE ON public.cargos_departamento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir os novos cargos solicitados para a empresa Varejo
INSERT INTO public.cargos_departamento (empresa_id, departamento_id, cargo_nome) 
SELECT 
  e.id as empresa_id,
  d.id as departamento_id,
  cargo.nome as cargo_nome
FROM empresas e
CROSS JOIN departamentos d
CROSS JOIN (
  VALUES 
    ('Analista de Controladoria'),
    ('Assistente Fiscal'),
    ('Marketing')
) as cargo(nome)
WHERE e.nome = 'Varejo' 
AND d.empresa_id = e.id 
AND e.status = 'ativo' 
AND d.status = 'ativo';