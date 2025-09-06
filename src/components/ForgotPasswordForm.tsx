import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { useForgotPassword } from '@/hooks/useForgotPassword';

const forgotPasswordSchema = z.object({
  email: z.string().email('Por favor, digite um email válido'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onBack: () => void;
  showExpiredMessage?: boolean;
}

export const ForgotPasswordForm = ({ onBack, showExpiredMessage = false }: ForgotPasswordFormProps) => {
  const { isLoading, emailSent, sendResetEmail, resetForm } = useForgotPassword();

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onSubmit',
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    await sendResetEmail(data.email);
  };

  const handleBack = () => {
    resetForm();
    form.reset();
    onBack();
  };

  const handleTryAgain = () => {
    resetForm();
    form.reset();
  };

  if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold">Email Enviado!</h3>
          <p className="text-sm text-muted-foreground">
            Verifique sua caixa de entrada e clique no link para redefinir sua senha.
          </p>
          <p className="text-xs text-muted-foreground">
            O link é válido por 1 hora.
          </p>
        </div>
        
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleTryAgain}
          >
            Enviar Novamente
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {showExpiredMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O link de recuperação expirou. Por favor, solicite um novo link de redefinição de senha.
            </AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
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
                    disabled={isLoading}
                    {...field}
                  />
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
            {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleBack}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Login
          </Button>
        </div>
      </form>
    </Form>
  );
};