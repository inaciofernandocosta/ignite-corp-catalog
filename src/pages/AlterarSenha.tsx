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
      console.log('AlterarSenha - URL completa:', window.location.href);
      console.log('AlterarSenha - Hash:', hash);
      console.log('AlterarSenha - Search:', window.location.search);
      
      if (hash.includes('access_token') && hash.includes('type=recovery')) {
        console.log('AlterarSenha - Token de recovery detectado');
        
        // Extrair parâmetros do hash
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        
        if (access_token && refresh_token) {
          // Apenas validar os tokens sem estabelecer sessão persistente
          try {
            // Validar os tokens fazendo uma verificação simples
            const response = await fetch(`https://fauoxtziffljgictcvhi.supabase.co/auth/v1/user`, {
              headers: {
                'Authorization': `Bearer ${access_token}`,
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdW94dHppZmZsamdpY3RjdmhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MTcwNzYsImV4cCI6MjA2NjA5MzA3Nn0.rox_ZN0RwGHW4lY_HtVrOLZ4acVcQ237FfewAOOaQ0s'
              }
            });
            
            if (response.ok) {
              console.log('Tokens válidos - permitindo alteração de senha');
              setHasValidToken(true);
              
              // Armazenar tokens temporariamente para uso no formulário
              sessionStorage.setItem('recovery_access_token', access_token);
              sessionStorage.setItem('recovery_refresh_token', refresh_token);
            } else {
              throw new Error('Tokens inválidos');
            }
          } catch (error) {
            console.error('Erro ao validar tokens:', error);
            toast({
              title: "Link inválido",
              description: "Este link de alteração de senha expirou ou é inválido.",
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
    
    // Limpar tokens temporários e redirecionar para login
    sessionStorage.removeItem('recovery_access_token');
    sessionStorage.removeItem('recovery_refresh_token');
    
    setTimeout(() => {
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