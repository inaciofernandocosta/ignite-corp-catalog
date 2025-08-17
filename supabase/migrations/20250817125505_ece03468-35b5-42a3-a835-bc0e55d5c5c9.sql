-- Migração para melhorar a estrutura de inscrições em cursos

-- Verificar se a tabela inscricoes_cursos tem todas as colunas necessárias
-- (A tabela já existe, apenas garantindo que está completa)

-- Atualizar políticas RLS para permitir que usuários logados se inscrevam
DROP POLICY IF EXISTS "Usuários podem se inscrever em cursos" ON public.inscricoes_cursos;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias inscrições" ON public.inscricoes_cursos;

-- Política para permitir inserção (inscrição)
CREATE POLICY "Usuários podem se inscrever em cursos" 
ON public.inscricoes_cursos 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Verificar se o aluno_id corresponde a um usuário autenticado ativo
  EXISTS (
    SELECT 1 FROM public.inscricoes_mentoria im
    WHERE im.id = aluno_id 
    AND im.email = (auth.jwt() ->> 'email')
    AND im.ativo = true
  )
);

-- Política para permitir que usuários vejam suas próprias inscrições
CREATE POLICY "Usuários podem ver suas próprias inscrições" 
ON public.inscricoes_cursos 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inscricoes_mentoria im
    WHERE im.id = aluno_id 
    AND im.email = (auth.jwt() ->> 'email')
    AND im.ativo = true
  )
);

-- Política para administradores terem acesso completo
CREATE POLICY "Administradores podem gerenciar inscrições" 
ON public.inscricoes_cursos 
FOR ALL 
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Criar função para envio de e-mail de confirmação de inscrição (trigger)
CREATE OR REPLACE FUNCTION public.send_course_enrollment_confirmation()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Chamar edge function para envio de e-mail de confirmação
  PERFORM public.call_edge_function(
    'send-course-enrollment-confirmation',
    jsonb_build_object(
      'enrollmentData', jsonb_build_object(
        'enrollment_id', NEW.id,
        'course_id', NEW.curso_id,
        'student_id', NEW.aluno_id,
        'enrollment_date', NEW.data_inscricao
      )
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Criar trigger para envio automático de e-mail de confirmação
DROP TRIGGER IF EXISTS send_enrollment_confirmation_trigger ON public.inscricoes_cursos;
CREATE TRIGGER send_enrollment_confirmation_trigger
AFTER INSERT ON public.inscricoes_cursos
FOR EACH ROW
EXECUTE FUNCTION public.send_course_enrollment_confirmation();