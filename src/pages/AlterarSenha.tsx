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
      const hash = window.location.hash;
      
      if (hash.includes('access_token') && hash.includes('type=recovery')) {
        console.log('AlterarSenha - Token de recovery detectado');
        
        // Extrair parâmetros do hash
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        
        if (access_token && refresh_token) {
          try {
            // Estabelecer sessão com os tokens
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token
            });
            
            if (error) {
              console.error('Erro ao estabelecer sessão:', error);
              toast({
                title: "Link inválido",
                description: "Este link de alteração de senha expirou ou é inválido.",
                variant: "destructive",
              });
              navigate("/auth");
            } else {
              console.log('Sessão estabelecida com sucesso');
              setHasValidToken(true);
            }
          } catch (error) {
            console.error('Erro:', error);
            toast({
              title: "Erro",
              description: "Ocorreu um erro ao processar o link de alteração de senha.",
              variant: "destructive",
            });
            navigate("/auth");
          }
        }
      } else {
        console.log('AlterarSenha - Nenhum token válido encontrado');
        toast({
          title: "Acesso negado",
          description: "Esta página só pode ser acessada através de um link de alteração de senha válido.",
          variant: "destructive",
        });
        navigate("/auth");
      }
      
      setIsLoading(false);
    };

    checkRecoveryToken();
  }, [navigate, toast]);

  const handleSuccess = () => {
    toast({
      title: "Senha alterada com sucesso!",
      description: "Sua senha foi atualizada. Você será redirecionado para o login.",
    });
    
    // Limpar a sessão e redirecionar para login após alguns segundos
    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate("/auth");
    }, 2000);
  };

  const handleBack = () => {
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasValidToken) {
    return null; // Componente será redirecionado
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Alterar Senha</CardTitle>
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