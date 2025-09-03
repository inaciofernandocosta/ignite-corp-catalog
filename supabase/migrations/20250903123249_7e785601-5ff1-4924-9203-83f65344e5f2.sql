-- Inserir usuários encontrados na tabela inscricoes_cursos como pendentes
-- Curso: IA na pratica (01994310-7306-4bec-9ee9-16d51140dbca)

INSERT INTO public.inscricoes_cursos (curso_id, aluno_id, status) 
SELECT 
  '01994310-7306-4bec-9ee9-16d51140dbca'::uuid as curso_id,
  DISTINCT ON (email) id as aluno_id,
  'pendente' as status
FROM public.inscricoes_mentoria 
WHERE email IN (
  'vinicius.novaes@vilanova.com.br',
  'ana.fernandes@vilanova.com.br', 
  'caroline.morgao@vilanova.com.br',
  'pablo.silva@vilanova.com.br',
  'luiza.araujo@vilanova.com.br',
  'dulce.behnen@vilanova.com.br',
  'comex2@vilanova.com.br',
  'geovana.dias@vilanova.com.br',
  'larissa.novoa@vilanova.com.br'
)
AND ativo = true
AND id NOT IN (
  SELECT aluno_id FROM public.inscricoes_cursos 
  WHERE curso_id = '01994310-7306-4bec-9ee9-16d51140dbca'
);