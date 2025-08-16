import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';
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
  
  const navigate = useNavigate();
  const { signIn, user, loading } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const onLogin = async (data: LoginFormData) => {
    console.log('Auth - onLogin chamado:', data);
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
    console.log('Auth - Voltando para login');
    setShowForgotPassword(false);
    loginForm.reset();
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao início
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Mentoria Futura
          </h1>
          <p className="text-muted-foreground mt-2">
            Acesse sua área do aluno
          </p>
        </div>

        <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">
              {showForgotPassword ? 'Recuperar Senha' : 'Área do Aluno'}
            </CardTitle>
            <CardDescription>
              {showForgotPassword 
                ? 'Digite seu email para recuperar sua senha'
                : 'Entre com sua conta'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              <ForgotPasswordForm onBack={handleBackToLogin} />
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
                      onClick={() => {
                        console.log('Auth - Indo para esqueci senha');
                        setShowForgotPassword(true);
                      }}
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