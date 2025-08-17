-- Criar inscrição em curso para o Inácio Fernando
INSERT INTO inscricoes_cursos (aluno_id, curso_id, progresso, status)
SELECT 
  im.id as aluno_id,
  c.id as curso_id,
  100.00 as progresso,
  'ativo' as status
FROM inscricoes_mentoria im, cursos c
WHERE im.email = 'inacio.fernando@gmail.com' 
  AND c.titulo = 'IA na Pratica'
  AND NOT EXISTS (
    SELECT 1 FROM inscricoes_cursos ic 
    WHERE ic.aluno_id = im.id AND ic.curso_id = c.id
  );

-- Criar certificado para o Inácio Fernando
INSERT INTO certificados_conclusao (inscricao_curso_id, data_conclusao, status, aprovado_por, observacoes)
SELECT 
  ic.id as inscricao_curso_id, 
  CURRENT_DATE as data_conclusao,
  'aprovado' as status,
  'Admin' as aprovado_por,
  'Certificado de teste' as observacoes
FROM inscricoes_cursos ic
JOIN inscricoes_mentoria im ON ic.aluno_id = im.id
WHERE im.email = 'inacio.fernando@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM certificados_conclusao cc 
    WHERE cc.inscricao_curso_id = ic.id
  );