-- Atualizar os slugs dos cursos existentes usando a função de geração de slug
UPDATE cursos 
SET slug = generate_slug(titulo)
WHERE slug IS NULL OR slug = '';

-- Criar um trigger para gerar automaticamente o slug quando um curso for criado ou atualizado
CREATE OR REPLACE FUNCTION auto_generate_course_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.titulo);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_course_slug
  BEFORE INSERT OR UPDATE ON cursos
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_course_slug();