import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const sendResetEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      console.log('🔄 Enviando email de recuperação para:', email);
      
      const { data, error } = await supabase.functions.invoke('forgot-password', {
        body: { email }
      });

      console.log('📊 Resposta da função:', { data, error });

      if (error) {
        console.error('❌ Erro na função:', error);
        toast({
          title: 'Erro ao enviar email',
          description: 'Tente novamente em alguns minutos.',
          variant: 'destructive',
        });
        return { success: false, error: error.message };
      }

      if (data?.success) {
        console.log('✅ Email enviado com sucesso');
        setEmailSent(true);
        toast({
          title: 'Email enviado!',
          description: 'Verifique sua caixa de entrada para redefinir sua senha.',
        });
        return { success: true };
      } else {
        console.error('❌ Resposta de erro:', data);
        toast({
          title: 'Erro ao processar solicitação',
          description: data?.error || 'Tente novamente.',
          variant: 'destructive',
        });
        return { success: false, error: data?.error };
      }
      
    } catch (error: any) {
      console.error('💥 Erro no catch:', error);
      toast({
        title: 'Erro de conexão',
        description: 'Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmailSent(false);
  };

  return {
    isLoading,
    emailSent,
    sendResetEmail,
    resetForm,
  };
};