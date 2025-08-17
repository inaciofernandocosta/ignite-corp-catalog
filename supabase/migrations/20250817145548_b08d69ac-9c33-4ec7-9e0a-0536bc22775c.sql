-- Create trigger on inscricoes_cursos to sync status with inscricoes_mentoria
CREATE TRIGGER sync_enrollment_status_trigger
  AFTER UPDATE ON public.inscricoes_cursos
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_enrollment_status();