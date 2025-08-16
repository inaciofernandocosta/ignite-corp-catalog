-- Criar função para gerar slug
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(title),
          '[àáâãäå]', 'a', 'g'
        ),
        '[èéêë]', 'e', 'g'
      ),
      '[ìíîï]', 'i', 'g'
    ),
    '[^a-z0-9]', '-', 'g'
  );
END;
$$ LANGUAGE plpgsql;