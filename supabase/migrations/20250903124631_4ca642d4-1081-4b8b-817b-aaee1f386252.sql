-- Adicionar campos de limite de alunos na tabela cursos
ALTER TABLE public.cursos 
ADD COLUMN limite_alunos INTEGER DEFAULT NULL,
ADD COLUMN limite_por_departamento INTEGER DEFAULT NULL;