import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePasswordReset } from '@/hooks/usePasswordReset';

const emailSchema = z.object({
  email: z.string().email('Por favor, digite um email válido'),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface NewForgotPasswordFormProps {
  onBack: () => void;
  showExpiredMessage?: boolean;
}

export const NewForgotPasswordForm = ({ onBack, showExpiredMessage = false }: NewForgotPasswordFormProps) => {
  const { isLoading, emailSent, sendResetEmail, resetStates } = usePasswordReset();

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: 'onSubmit',
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: EmailFormData) => {
    await sendResetEmail(data.email);
  };

  const handleBack = () => {
    resetStates();
    form.reset();
    onBack();
  };

  const handleTryAgain = () => {
    resetStates();
    form.reset();
  };

  // Tela de sucesso após envio do email
  if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">Email Enviado!</h3>
            <p className="text-muted-foreground">
              Enviamos um link de recuperação para o seu email.
            </p>
            <p className="text-sm text-muted-foreground">
              Verifique sua caixa de entrada e clique no link para redefinir sua senha.
            </p>
          </div>
          
          <Alert className="border-blue-200 bg-blue-50">
            <Mail className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Dica:</strong> Se não encontrar o email, verifique sua pasta de spam. 
              O link expira em 1 hora por motivos de segurança.
            </AlertDescription>
          </Alert>
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

  // Formulário de entrada do email
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {showExpiredMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O link de recuperação expirou ou é inválido. Por favor, solicite um novo link.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-semibold">Recuperar Senha</h3>
          <p className="text-sm text-muted-foreground">
            Digite seu email cadastrado para receber as instruções de recuperação.
          </p>
        </div>
        
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
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              'Enviar Link de Recuperação'
            )}
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
        
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            <strong>Importante:</strong> Certifique-se de que o email informado é o mesmo 
            utilizado no seu cadastro na plataforma.
          </AlertDescription>
        </Alert>
      </form>
    </Form>
  );
};