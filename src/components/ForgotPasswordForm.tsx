import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Por favor, digite um email válido'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  onBack: () => void;
  showExpiredMessage?: boolean;
}

export const ForgotPasswordForm = ({ onBack, showExpiredMessage = false }: ForgotPasswordFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const { resetPassword } = useAuth();

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onSubmit',
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsSubmitting(true);
    
    try {
      const result = await resetPassword(data.email);
      
      if (!result.error) {
        setEmailSent(true);
      }
    } catch (error) {
      setIsBlocked(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setEmailSent(false);
    form.reset();
    onBack();
  };

  const handleTryAgain = () => {
    setEmailSent(false);
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
                    disabled={isSubmitting}
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
            disabled={isSubmitting || isBlocked}
          >
            {isSubmitting ? 'Enviando...' : 
             isBlocked ? 'Aguarde 2 minutos...' : 
             'Enviar Link de Recuperação'}
          </Button>
          
          {isBlocked && (
            <p className="text-sm text-orange-600 text-center">
              Muitas tentativas detectadas. Aguarde alguns minutos antes de tentar novamente.
            </p>
          )}
          
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Login
          </Button>
        </div>
      </form>
    </Form>
  );
};