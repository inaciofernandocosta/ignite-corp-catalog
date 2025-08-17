-- Create trigger to sync status between inscricoes_cursos and inscricoes_mentoria
CREATE OR REPLACE FUNCTION public.sync_enrollment_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- When inscricoes_cursos status changes to 'aprovado' or 'reprovado',
  -- sync the status in inscricoes_mentoria
  IF OLD.status != NEW.status AND NEW.status IN ('aprovado', 'reprovado') THEN
    UPDATE public.inscricoes_mentoria 
    SET 
      status = NEW.status,
      ativo = CASE WHEN NEW.status = 'aprovado' THEN true ELSE false END,
      data_aprovacao = CASE WHEN NEW.status = 'aprovado' THEN NOW() ELSE data_aprovacao END
    WHERE id = NEW.aluno_id;
  END IF;
  
  RETURN NEW;
END;
$function$

-- Create trigger on inscricoes_cursos
DROP TRIGGER IF EXISTS sync_enrollment_status_trigger ON public.inscricoes_cursos;
CREATE TRIGGER sync_enrollment_status_trigger
  AFTER UPDATE ON public.inscricoes_cursos
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_enrollment_status();