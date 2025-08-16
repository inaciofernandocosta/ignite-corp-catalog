-- Adicionar campo data_imersao na tabela course_banners
ALTER TABLE public.course_banners 
ADD COLUMN data_imersao DATE;

-- Inserir dados de exemplo com data de imersão
INSERT INTO public.course_banners (
  message, 
  course_slug, 
  background_color, 
  text_color, 
  border_color, 
  icon, 
  is_active,
  data_imersao
) VALUES (
  'Primeira Turma - Agosto 2025 | Vagas Encerradas',
  'ia-na-pratica',
  'rgba(202, 138, 4, 0.2)',
  '#fcd34d',
  'rgba(202, 138, 4, 0.4)',
  '🎯',
  true,
  '2025-09-03'
) 
ON CONFLICT (course_slug) DO UPDATE SET
  message = EXCLUDED.message,
  data_imersao = EXCLUDED.data_imersao,
  is_active = EXCLUDED.is_active;