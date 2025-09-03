-- Aprovar as 7 pessoas que estão rejeitadas
UPDATE public.inscricoes_mentoria 
SET 
  status = 'aprovado',
  ativo = true,
  data_aprovacao = NOW()
WHERE email IN (
  'ana.fernandes@vilanova.com.br',
  'caroline.morgao@vilanova.com.br',
  'comex2@vilanova.com.br',
  'dulce.behnen@vilanova.com.br',
  'geovana.dias@vilanova.com.br',
  'luiza.araujo@vilanova.com.br',
  'pablo.silva@vilanova.com.br'
)
AND status = 'rejeitado'
AND ativo = false;

-- Inserir essas pessoas no curso como pendentes
INSERT INTO public.inscricoes_cursos (curso_id, aluno_id, status)
SELECT 
  '01994310-7306-4bec-9ee9-16d51140dbca'::uuid as curso_id,
  im.id as aluno_id,
  'pendente' as status
FROM public.inscricoes_mentoria im
WHERE im.email IN (
  'ana.fernandes@vilanova.com.br',
  'caroline.morgao@vilanova.com.br',
  'comex2@vilanova.com.br',
  'dulce.behnen@vilanova.com.br',
  'geovana.dias@vilanova.com.br',
  'luiza.araujo@vilanova.com.br',
  'pablo.silva@vilanova.com.br'
)
AND im.status = 'aprovado'
AND im.ativo = true
AND im.id NOT IN (
  SELECT aluno_id FROM public.inscricoes_cursos 
  WHERE curso_id = '01994310-7306-4bec-9ee9-16d51140dbca'
);