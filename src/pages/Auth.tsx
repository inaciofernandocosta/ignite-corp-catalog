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

export const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, user, loading, session } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Check for password recovery mode FIRST - before any redirects
  useEffect(() => {
    const checkRecoveryMode = async () => {
      // Verificar se há erro na URL (token expirado, etc.)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const error = hashParams.get('error');
      const errorCode = hashParams.get('error_code');
      const errorDescription = hashParams.get('error_description');

      if (error === 'access_denied' && errorCode === 'otp_expired') {
        
        // Mostrar mensagem de erro e redirecionar para form de esqueci senha
        setShowForgotPassword(true);
        setIsRecoveryMode(false);
        setShowResetPassword(false);
        // Limpar hash da URL e adicionar parâmetro expired
        window.history.replaceState(null, '', '/auth?expired=true');
        return;
      }

      // Verificar se tem parâmetro type=recovery na URL
      if (searchParams.get('type') === 'recovery') {
        
        setIsRecoveryMode(true);
        setShowResetPassword(true);
        return;
      }

      // Verificar se é um link de recovery via hash fragment
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (accessToken && refreshToken && type === 'recovery') {
        
        try {
          // Estabelecer sessão com os tokens do link
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (!error) {
            
            setIsRecoveryMode(true);
            setShowResetPassword(true);
            // Limpar hash da URL
            window.history.replaceState(null, '', window.location.pathname + '?type=recovery');
          } else {
            console.error('Auth - Erro ao estabelecer sessão de recovery:', error);
            // Se falhar, limpar estado e mostrar esqueci senha
            setIsRecoveryMode(false);
            setShowResetPassword(false);
            setShowForgotPassword(true);
          }
        } catch (error) {
          console.error('Auth - Erro ao processar link de recovery:', error);
          // Se falhar, limpar estado e mostrar esqueci senha
          setIsRecoveryMode(false);
          setShowResetPassword(false);
          setShowForgotPassword(true);
        }
      }
    };

    checkRecoveryMode();
  }, [searchParams, supabase.auth]);

  // Redirect if already authenticated (but not in recovery mode) - RUNS AFTER recovery check
  useEffect(() => {
    // Aguardar um tick para garantir que a verificação de recovery foi processada
    const timer = setTimeout(() => {
      if (!loading && user && !isRecoveryMode && !showResetPassword && !showForgotPassword) {
        
        navigate('/dashboard');
      }
    }, 200); // Aumentar o timeout para dar mais tempo para recovery mode ser detectado

    return () => clearTimeout(timer);
  }, [user, loading, navigate, isRecoveryMode, showResetPassword, showForgotPassword]);

  const onLogin = async (data: LoginFormData) => {
    
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (!error) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Auth - Erro no login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    
    setShowForgotPassword(false);
    setShowResetPassword(false);
    setIsRecoveryMode(false);
    loginForm.reset();
    // Remover parâmetro expired se existir
    if (searchParams.get('expired')) {
      window.history.replaceState(null, '', '/auth');
    }
  };

  const handleResetSuccess = async () => {
    console.log('Auth - handleResetSuccess: Iniciando processo de logout após reset');
    
    try {
      // Resetar estados primeiro
      setShowResetPassword(false);
      setIsRecoveryMode(false);
      
      // Limpar URL
      window.history.replaceState(null, '', '/auth');
      
      // Fazer logout do usuário após alterar a senha
      await supabase.auth.signOut();
      
      console.log('Auth - handleResetSuccess: Logout realizado com sucesso');
      
    } catch (error) {
      console.error('Auth - handleResetSuccess: Erro no logout:', error);
    }
  };

  if (loading) {
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