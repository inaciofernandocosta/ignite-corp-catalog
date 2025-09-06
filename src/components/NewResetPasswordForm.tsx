import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { usePasswordReset } from '@/hooks/usePasswordReset';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

const passwordSchema = z.object({
  password: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface NewResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
  onBack: () => void;
}

export const NewResetPasswordForm = ({ token, onSuccess, onBack }: NewResetPasswordFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { isLoading, confirmPasswordReset } = usePasswordReset();

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = form.watch('password');

  const onSubmit = async (data: PasswordFormData) => {
    const result = await confirmPasswordReset(token, data.password);
    
    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }
  };

  // Tela de sucesso
  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">Senha Alterada!</h3>
            <p className="text-muted-foreground">
              Sua senha foi atualizada com sucesso.
            </p>
            <p className="text-sm text-muted-foreground">
              Você será redirecionado para o login em instantes...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-semibold">Nova Senha</h3>
          <p className="text-sm text-muted-foreground">
            Digite sua nova senha. Ela deve ser segura e fácil de lembrar.
          </p>
        </div>
        
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            <strong>Dica de Segurança:</strong> Use uma combinação de letras maiúsculas, 
            minúsculas, números e símbolos para criar uma senha forte.
          </AlertDescription>
        </Alert>
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova Senha</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua nova senha"
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
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
              
              {/* Indicador de força da senha */}
              {watchedPassword && (
                <PasswordStrengthIndicator password={watchedPassword} />
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Nova Senha</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite novamente sua nova senha"
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-10 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
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
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Atualizando...
              </>
            ) : (
              'Atualizar Senha'
            )}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={onBack}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
};