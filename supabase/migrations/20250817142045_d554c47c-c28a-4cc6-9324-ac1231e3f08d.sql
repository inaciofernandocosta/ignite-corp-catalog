-- Criar trigger para envio de e-mail de aprovação na tabela inscricoes_cursos
CREATE OR REPLACE FUNCTION public.trigger_send_approval_email_cursos()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Verificar se o status mudou para 'aprovado'
  IF OLD.status != 'aprovado' AND NEW.status = 'aprovado' THEN
    -- Chamar edge function de aprovação
    PERFORM public.call_edge_function(
      'send-approval-email',
      jsonb_build_object(
        'enrollmentData', jsonb_build_object(
          'enrollment_id', NEW.id,
          'course_id', NEW.curso_id,
          'student_id', NEW.aluno_id,
          'status', NEW.status
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger que executa após atualização do status em inscricoes_cursos
CREATE OR REPLACE TRIGGER send_approval_email_cursos_trigger
  AFTER UPDATE ON public.inscricoes_cursos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_approval_email_cursos();