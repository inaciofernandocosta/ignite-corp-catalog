-- Adicionar campos necessários à tabela cursos
ALTER TABLE public.cursos 
ADD COLUMN data_inicio DATE,
ADD COLUMN data_fim DATE,
ADD COLUMN local_id UUID REFERENCES public.locais(id);

-- Criar bucket para imagens dos cursos
INSERT INTO storage.buckets (id, name, public) VALUES ('course-images', 'course-images', true);

-- Políticas para o bucket de imagens dos cursos
CREATE POLICY "Imagens de cursos são públicas" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'course-images');

CREATE POLICY "Usuários autenticados podem fazer upload de imagens de cursos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'course-images');

CREATE POLICY "Usuários autenticados podem atualizar imagens de cursos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'course-images');

CREATE POLICY "Usuários autenticados podem deletar imagens de cursos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'course-images');