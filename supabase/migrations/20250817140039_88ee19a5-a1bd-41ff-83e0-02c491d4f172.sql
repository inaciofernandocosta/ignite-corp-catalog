-- Criar trigger para envio automático de e-mail de confirmação de inscrição
CREATE OR REPLACE FUNCTION public.trigger_send_course_enrollment_confirmation()
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

-- Criar trigger que executa após inserção de nova inscrição
CREATE OR REPLACE TRIGGER send_course_enrollment_confirmation_trigger
  AFTER INSERT ON public.inscricoes_cursos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_course_enrollment_confirmation();