-- Adicionar campo para certificado template nos cursos
ALTER TABLE public.cursos 
ADD COLUMN certificado_template text;