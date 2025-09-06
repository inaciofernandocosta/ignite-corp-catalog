import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export const AlterarSenha = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [hasValidToken, setHasValidToken] = useState(false);

  useEffect(() => {
    const checkRecoveryToken = async () => {
      console.log('AlterarSenha - Verificando token de recuperação');
      
      try {
        // Verificar se há tokens de recovery na URL (hash ou search)
        const hash = window.location.hash.substring(1);
        const search = window.location.search.substring(1);
        
        // Tentar primeiro no hash, depois no search
        let urlParams = new URLSearchParams(hash.includes('access_token') ? hash : search);
        
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const type = urlParams.get('type');
        const error = urlParams.get('error');
        
        console.log('Parâmetros encontrados:', {
          accessToken: accessToken ? 'presente' : 'ausente',
          refreshToken: refreshToken ? 'presente' : 'ausente',
          type,
          error
        });

        // Se há erro de token expirado ou inválido
        if (error) {
          console.log('Erro detectado:', error);
          toast({
            title: "Link inválido",
            description: "Este link de alteração de senha expirou ou é inválido.",
            variant: "destructive",
          });
          navigate("/auth?expired=true");
          return;
        }

        // Se é um link de recovery válido
        if (accessToken && refreshToken && type === 'recovery') {
          console.log('Link de recovery válido detectado');
          
          try {
            // Estabelecer sessão temporária para permitir reset de senha
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (!sessionError) {
              console.log('Sessão temporária estabelecida');
              setHasValidToken(true);
              
              // Limpar hash da URL para segurança
              window.history.replaceState(null, '', '/alterar-senha');
            } else {
              console.error('Erro ao estabelecer sessão:', sessionError);
              toast({
                title: "Erro de autenticação",
                description: "Não foi possível validar o link de recuperação.",
                variant: "destructive",
              });
              navigate("/auth?expired=true");
            }
          } catch (err) {
            console.error('Erro ao processar recovery:', err);
            toast({
              title: "Erro interno",
              description: "Ocorreu um erro ao processar sua solicitação.",
              variant: "destructive",
            });
            navigate("/auth");
          }
        } else {
          console.log('Nenhum token válido encontrado');
          toast({
            title: "Acesso negado",
            description: "Esta página só pode ser acessada através de um link de alteração de senha válido.",
            variant: "destructive",
          });
          navigate("/auth");
        }
      } catch (error) {
        console.error('Erro na verificação de token:', error);
        toast({
          title: "Erro interno",
          description: "Ocorreu um erro ao validar o link de recuperação.",
          variant: "destructive",
        });
        navigate("/auth");
      } finally {
        setIsLoading(false);
      }
    };

    checkRecoveryToken();
  }, [navigate, toast]);

  const handleSuccess = async () => {
    console.log('Reset de senha realizado com sucesso');
    
    toast({
      title: "Senha alterada com sucesso!",
      description: "Sua senha foi atualizada. Você será redirecionado para o login.",
    });
    
    try {
      // Fazer logout para limpar a sessão temporária
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro no logout:', error);
    }
    
    setTimeout(() => {
      navigate("/auth");
    }, 2000);
  };

  const handleBack = async () => {
    try {
      // Fazer logout antes de voltar
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro no logout:', error);
    }
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Validando link de recuperação...</p>
        </div>
      </div>
    );
  }

  if (!hasValidToken) {
    return null; // Componente será redirecionado
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm onSuccess={handleSuccess} onBack={handleBack} />
        </CardContent>
      </Card>
    </div>
  );
};