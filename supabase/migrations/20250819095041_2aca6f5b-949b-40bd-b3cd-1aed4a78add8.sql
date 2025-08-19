-- =====================================================
-- BACKFILL: Criar contas de autenticação para usuários existentes
-- =====================================================

-- Função para criar contas de auth para usuários existentes que não têm
CREATE OR REPLACE FUNCTION public.backfill_auth_accounts()
RETURNS TABLE(
  email text,
  nome text,
  resultado text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usuario RECORD;
  resultado_linha RECORD;
BEGIN
  -- Loop através de todos os usuários ativos que não têm conta de auth
  FOR usuario IN 
    SELECT im.email, im.nome
    FROM public.inscricoes_mentoria im
    WHERE im.ativo = true 
    AND im.status = 'aprovado'
    AND NOT EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.email = im.email
    )
  LOOP
    -- Tentar criar conta de auth com senha temporária
    BEGIN
      PERFORM public.criar_conta_auth_segura(
        usuario.email, 
        'TempPassword123!'
      );
      
      -- Retornar sucesso
      RETURN QUERY SELECT 
        usuario.email,
        usuario.nome,
        'Conta criada com sucesso'::text;
        
    EXCEPTION WHEN OTHERS THEN
      -- Retornar erro mas continuar com próximo usuário
      RETURN QUERY SELECT 
        usuario.email,
        usuario.nome,
        ('Erro: ' || SQLERRM)::text;
    END;
  END LOOP;
  
  RETURN;
END;
$$;

-- Comentário explicando o uso
COMMENT ON FUNCTION public.backfill_auth_accounts() IS 'Cria contas de autenticação para usuários existentes que não possuem. Use: SELECT * FROM backfill_auth_accounts();';