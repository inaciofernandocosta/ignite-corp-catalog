-- Create function to sync status between inscricoes_cursos and inscricoes_mentoria
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
$function$;