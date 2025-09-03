-- Criar função segura para verificar limites de curso
CREATE OR REPLACE FUNCTION public.verificar_limites_curso(p_curso_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  curso_data RECORD;
  total_inscricoes INTEGER;
  departamentos_contagem JSON;
  departamentos_limite_atingido TEXT[];
  resultado JSON;
BEGIN
  -- Buscar dados do curso
  SELECT limite_alunos, limite_por_departamento 
  INTO curso_data
  FROM public.cursos 
  WHERE id = p_curso_id AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'error', 'Curso não encontrado',
      'totalEnrolled', 0,
      'limitReached', false,
      'departmentLimitsReached', '[]'::json,
      'canEnroll', false
    );
  END IF;
  
  -- Contar total de inscrições (aprovadas + pendentes)
  SELECT COUNT(*) INTO total_inscricoes
  FROM public.inscricoes_cursos ic
  WHERE ic.curso_id = p_curso_id
  AND ic.status IN ('aprovado', 'pendente');
  
  -- Verificar se limite total foi atingido
  IF curso_data.limite_alunos IS NOT NULL AND total_inscricoes >= curso_data.limite_alunos THEN
    RETURN json_build_object(
      'totalEnrolled', total_inscricoes,
      'limitReached', true,
      'departmentLimitsReached', '[]'::json,
      'canEnroll', false,
      'departmentCounts', '{}'::json
    );
  END IF;
  
  -- Se há limite por departamento, verificar departamentos
  departamentos_limite_atingido := ARRAY[]::TEXT[];
  departamentos_contagem := '{}'::json;
  
  IF curso_data.limite_por_departamento IS NOT NULL THEN
    -- Contar por departamento
    SELECT json_object_agg(dept_count.departamento, dept_count.count_dept)
    INTO departamentos_contagem
    FROM (
      SELECT 
        COALESCE(im.departamento, 'Sem departamento') as departamento,
        COUNT(*) as count_dept
      FROM public.inscricoes_cursos ic
      JOIN public.inscricoes_mentoria im ON im.id = ic.aluno_id
      WHERE ic.curso_id = p_curso_id
      AND ic.status IN ('aprovado', 'pendente')
      GROUP BY COALESCE(im.departamento, 'Sem departamento')
    ) dept_count;
    
    -- Encontrar departamentos que atingiram o limite
    SELECT ARRAY_AGG(departamento)
    INTO departamentos_limite_atingido
    FROM (
      SELECT 
        COALESCE(im.departamento, 'Sem departamento') as departamento
      FROM public.inscricoes_cursos ic
      JOIN public.inscricoes_mentoria im ON im.id = ic.aluno_id
      WHERE ic.curso_id = p_curso_id
      AND ic.status IN ('aprovado', 'pendente')
      GROUP BY COALESCE(im.departamento, 'Sem departamento')
      HAVING COUNT(*) >= curso_data.limite_por_departamento
    ) dept_limits;
  END IF;
  
  -- Resultado final
  RETURN json_build_object(
    'totalEnrolled', total_inscricoes,
    'limitReached', false,
    'departmentLimitsReached', COALESCE(departamentos_limite_atingido, ARRAY[]::TEXT[]),
    'canEnroll', true,
    'departmentCounts', COALESCE(departamentos_contagem, '{}'::json),
    'courseData', json_build_object(
      'limite_alunos', curso_data.limite_alunos,
      'limite_por_departamento', curso_data.limite_por_departamento
    )
  );
END;
$function$;

-- Permitir acesso público à função
GRANT EXECUTE ON FUNCTION public.verificar_limites_curso(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.verificar_limites_curso(UUID) TO authenticated;