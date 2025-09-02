import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/ResetPasswordForm';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Auth = () => {
  console.log('=== AUTH COMPONENT RENDERIZOU ===');
  console.log('URL completa:', window.location.href);
  console.log('Hash:', window.location.hash);
  console.log('Pathname:', window.location.pathname);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, user, loading } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Verificar modo de recovery
  useEffect(() => {
    const checkRecoveryMode = async () => {
      console.log('=== VERIFICANDO RECOVERY MODE ===');
      
      try {
        // Verificar se há tokens de recovery no hash
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const error = hashParams.get('error');
        
        console.log('Parâmetros encontrados:', {
          accessToken: accessToken ? 'presente' : 'ausente',
          refreshToken: refreshToken ? 'presente' : 'ausente',
          type,
          error
        });

        // Se há erro de token expirado
        if (error === 'access_denied') {
          console.log('Token expirado, mostrando forgot password');
          setShowForgotPassword(true);
          setShowResetPassword(false);
          window.history.replaceState(null, '', '/auth?expired=true');
          setIsInitialized(true);
          return;
        }

        // Se é um link de recovery válido
        if (accessToken && refreshToken && type === 'recovery') {
          console.log('Link de recovery válido detectado');
          
          try {
            // Estabelecer sessão
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (!sessionError) {
              console.log('Sessão estabelecida, mostrando reset password');
              setShowResetPassword(true);
              setShowForgotPassword(false);
              // Limpar hash
              window.history.replaceState(null, '', '/auth?type=recovery');
            } else {
              console.error('Erro ao estabelecer sessão:', sessionError);
              setShowForgotPassword(true);
            }
          } catch (err) {
            console.error('Erro ao processar recovery:', err);
            setShowForgotPassword(true);
          }
        }
        // Se já tem parâmetro type=recovery na URL
        else if (searchParams.get('type') === 'recovery') {
          console.log('Parâmetro type=recovery encontrado');
          setShowResetPassword(true);
          setShowForgotPassword(false);
        }
        // Se tem expired=true, mostrar forgot password
        else if (searchParams.get('expired') === 'true') {
          console.log('Parâmetro expired=true encontrado');
          setShowForgotPassword(true);
          setShowResetPassword(false);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Erro na verificação de recovery:', error);
        setIsInitialized(true);
      }
    };

    checkRecoveryMode();
  }, [searchParams]);

  // Redirecionar se já autenticado (mas não em recovery mode)
  useEffect(() => {
    if (isInitialized && !loading && user && !showResetPassword && !showForgotPassword) {
      console.log('Usuário autenticado, redirecionando para dashboard');
      navigate('/dashboard');
    }
  }, [user, loading, navigate, showResetPassword, showForgotPassword, isInitialized]);

  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (!error) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Erro no login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    console.log('Voltando para login');
    setShowForgotPassword(false);
    setShowResetPassword(false);
    loginForm.reset();
    window.history.replaceState(null, '', '/auth');
  };

  const handleResetSuccess = async () => {
    console.log('Reset realizado com sucesso');
    
    try {
      // Fazer logout
      await supabase.auth.signOut();
      
      // Resetar estados
      setShowResetPassword(false);
      setShowForgotPassword(false);
      
      // Limpar URL
      window.history.replaceState(null, '', '/auth');
      
    } catch (error) {
      console.error('Erro no logout após reset:', error);
    }
  };

  // Mostrar loading inicial
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="mb-6 sm:mb-8 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-muted-foreground hover:text-foreground text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao início
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Mentoria Futura
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Acesse sua área do aluno
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-4 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl">
              {showResetPassword ? 'Redefinir Senha' :
               showForgotPassword ? 'Recuperar Senha' : 
               'Área do Aluno'}
            </CardTitle>
            <CardDescription className="text-sm">
              {showResetPassword ? 'Digite sua nova senha' :
               showForgotPassword ? 'Digite seu email para recuperar sua senha' :
               'Entre com sua conta'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {showResetPassword ? (
              <ResetPasswordForm onSuccess={handleResetSuccess} onBack={handleBackToLogin} />
            ) : showForgotPassword ? (
              <ForgotPasswordForm onBack={handleBackToLogin} showExpiredMessage={searchParams.get('expired') === 'true'} />
            ) : (
              // Formulário de Login
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="seu@email.com"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Digite sua senha"
                              className="pl-10 pr-10"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Entrando...' : 'Entrar'}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Esqueci minha senha
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { Auth };
export default Auth;