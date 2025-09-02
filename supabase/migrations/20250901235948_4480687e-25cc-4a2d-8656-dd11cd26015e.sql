-- Fix trigger functions that still reference the removed call_edge_function

-- Update send_approval_email_trigger function
CREATE OR REPLACE FUNCTION public.send_approval_email_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Verificar se o status mudou para 'aprovado'
  IF OLD.status != 'aprovado' AND NEW.status = 'aprovado' THEN
    -- Chamar edge function de aprovação usando a função segura
    PERFORM public.call_edge_function_secure(
      'send-approval-email',
      jsonb_build_object(
        'studentData', to_jsonb(NEW),
        'activationToken', NEW.token_validacao
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to send approval email: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update send_admin_notification_trigger function
CREATE OR REPLACE FUNCTION public.send_admin_notification_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE NOTICE 'TRIGGER ADMIN: Executando para email %', NEW.email;
  
  -- Chamar edge function de notificação administrativa usando função segura
  PERFORM public.call_edge_function_secure(
    'send-admin-notification',
    jsonb_build_object(
      'studentData', jsonb_build_object(
        'id', NEW.id,
        'nome', NEW.nome,
        'email', NEW.email,
        'telefone', NEW.telefone,
        'empresa', NEW.empresa,
        'departamento', NEW.departamento,
        'cargo', NEW.cargo,
        'unidade', NEW.unidade,
        'created_at', NEW.created_at
      )
    )
  );
  
  RAISE NOTICE 'TRIGGER ADMIN: Chamada para edge function executada para %', NEW.email;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to send admin notification: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update send_confirmation_email_trigger function
CREATE OR REPLACE FUNCTION public.send_confirmation_email_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  RAISE NOTICE 'TRIGGER CONFIRMACAO: Executando para email %', NEW.email;
  
  -- Chamar edge function de confirmação usando função segura
  PERFORM public.call_edge_function_secure(
    'send-confirmation-email',
    jsonb_build_object(
      'studentData', jsonb_build_object(
        'nome', NEW.nome,
        'email', NEW.email,
        'telefone', NEW.telefone,
        'empresa', NEW.empresa,
        'departamento', NEW.departamento,
        'cargo', NEW.cargo,
        'unidade', NEW.unidade
      )
    )
  );
  
  RAISE NOTICE 'TRIGGER CONFIRMACAO: Chamada para edge function executada para %', NEW.email;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to send confirmation email: %', SQLERRM;
    RETURN NEW;
END;
$function$;