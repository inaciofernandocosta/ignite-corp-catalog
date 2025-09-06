import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewResetPasswordForm } from "@/components/NewResetPasswordForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const ResetarSenha = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      console.log('ResetarSenha - Validando token...');
      
      try {
        const tokenParam = searchParams.get('token');
        console.log('Token encontrado:', tokenParam ? 'sim' : 'não');
        
        if (!tokenParam) {
          setError('Token de recuperação não encontrado na URL');
          setIsLoading(false);
          return;
        }

        // Validação básica do formato do token
        const tokenRegex = /^[a-f0-9-]+$/i;
        if (!tokenRegex.test(tokenParam)) {
          setError('Formato de token inválido');
          setIsLoading(false);
          return;
        }

        console.log('Token válido encontrado');
        setToken(tokenParam);
        setError(null);
        
      } catch (error) {
        console.error('Erro ao validar token:', error);
        setError('Erro interno ao validar token');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [searchParams]);

  const handleSuccess = () => {
    console.log('Reset de senha concluído com sucesso');
    
    toast({
      title: "Senha alterada!",
      description: "Sua senha foi atualizada. Use-a para fazer login.",
    });
    
    setTimeout(() => {
      navigate("/auth");
    }, 1500);
  };

  const handleBack = () => {
    navigate("/auth");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Validando link de recuperação...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-bold text-destructive">
              Link Inválido
            </CardTitle>
            <CardDescription>
              Não foi possível validar o link de recuperação
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Token de recuperação não encontrado'}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Possíveis motivos:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>O link expirou (válido por 1 hora)</li>
                <li>O link já foi usado anteriormente</li>
                <li>O link está incompleto ou corrompido</li>
              </ul>
              
              <Button
                onClick={handleBack}
                className="w-full mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar e Solicitar Novo Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid token - show reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Redefinir Senha
          </CardTitle>
          <CardDescription>
            Crie uma nova senha segura para sua conta
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <NewResetPasswordForm 
            token={token}
            onSuccess={handleSuccess} 
            onBack={handleBack} 
          />
        </CardContent>
      </Card>
    </div>
  );
};