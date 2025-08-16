-- Criar tabela de empresas com as informações organizacionais
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de departamentos
CREATE TABLE public.departamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, nome)
);

-- Criar tabela de locais/unidades
CREATE TABLE public.locais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cidade TEXT,
  estado TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, nome)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para leitura pública (necessário para formulários)
CREATE POLICY "Permitir leitura pública de empresas" 
ON public.empresas 
FOR SELECT 
USING (status = 'ativo');

CREATE POLICY "Permitir leitura pública de departamentos" 
ON public.departamentos 
FOR SELECT 
USING (status = 'ativo');

CREATE POLICY "Permitir leitura pública de locais" 
ON public.locais 
FOR SELECT 
USING (status = 'ativo');

-- Políticas para administradores (assumindo que existam usuários admin)
CREATE POLICY "Admins podem gerenciar empresas" 
ON public.empresas 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins podem gerenciar departamentos" 
ON public.departamentos 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins podem gerenciar locais" 
ON public.locais 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_empresas_updated_at
BEFORE UPDATE ON public.empresas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_departamentos_updated_at
BEFORE UPDATE ON public.departamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locais_updated_at
BEFORE UPDATE ON public.locais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais para teste
INSERT INTO public.empresas (nome) VALUES 
('Mentoria Futura'),
('Tech Solutions'),
('Innovation Corp'),
('Digital Transform');

INSERT INTO public.departamentos (empresa_id, nome) 
SELECT e.id, d.nome FROM public.empresas e, 
(VALUES 
  ('Recursos Humanos'),
  ('Tecnologia da Informação'),
  ('Marketing'),
  ('Vendas'),
  ('Operações'),
  ('Financeiro')
) AS d(nome)
WHERE e.nome IN ('Mentoria Futura', 'Tech Solutions');

INSERT INTO public.locais (empresa_id, nome, cidade, estado)
SELECT e.id, l.nome, l.cidade, l.estado FROM public.empresas e,
(VALUES 
  ('Sede', 'Poços de Caldas', 'MG'),
  ('Filial São Paulo', 'São Paulo', 'SP'),
  ('Filial Rio de Janeiro', 'Rio de Janeiro', 'RJ'),
  ('Home Office', 'Remoto', 'BR')
) AS l(nome, cidade, estado)
WHERE e.nome IN ('Mentoria Futura', 'Tech Solutions');