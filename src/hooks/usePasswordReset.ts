import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UsePasswordResetReturn {
  // Estados
  isLoading: boolean;
  emailSent: boolean;
  
  // Ações
  sendResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetStates: () => void;
}

export const usePasswordReset = (): UsePasswordResetReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const sendResetEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      console.log('🔄 Enviando email de reset para:', email);
      
      const { data, error } = await supabase.functions.invoke('reset-password-email', {
        body: { email }
      });

      console.log('📊 Resposta da função:', { data, error });

      if (error) {
        console.error('❌ Erro na função:', error);
        
        const errorMessage = error.message || 'Erro ao enviar email de recuperação';
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
        
        return { success: false, error: errorMessage };
      }

      if (data?.success) {
        console.log('✅ Email enviado com sucesso');
        setEmailSent(true);
        
        toast({
          title: 'Email enviado!',
          description: data.message || 'Verifique sua caixa de entrada para redefinir sua senha.',
        });
        
        return { success: true };
      } else {
        const errorMessage = data?.error || 'Erro desconhecido';
        console.error('❌ Resposta de erro:', data);
        
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
        
        return { success: false, error: errorMessage };
      }
      
    } catch (error: any) {
      console.error('💥 Erro no catch:', error);
      
      const errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      toast({
        title: 'Erro de conexão',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPasswordReset = async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      console.log('🔄 Confirmando reset de senha...');
      
      const { data, error } = await supabase.functions.invoke('confirm-password-reset', {
        body: { token, newPassword }
      });

      console.log('📊 Resposta da confirmação:', { data, error });

      if (error) {
        console.error('❌ Erro na confirmação:', error);
        
        const errorMessage = error.message || 'Erro ao atualizar senha';
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
        
        return { success: false, error: errorMessage };
      }

      if (data?.success) {
        console.log('✅ Senha atualizada com sucesso');
        
        toast({
          title: 'Sucesso!',
          description: data.message || 'Sua senha foi atualizada com sucesso.',
        });
        
        return { success: true };
      } else {
        const errorMessage = data?.error || 'Erro desconhecido ao atualizar senha';
        console.error('❌ Resposta de erro:', data);
        
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
        
        return { success: false, error: errorMessage };
      }
      
    } catch (error: any) {
      console.error('💥 Erro no catch da confirmação:', error);
      
      const errorMessage = 'Erro de conexão. Tente novamente.';
      toast({
        title: 'Erro de conexão',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const resetStates = () => {
    setEmailSent(false);
    setIsLoading(false);
  };

  return {
    isLoading,
    emailSent,
    sendResetEmail,
    confirmPasswordReset,
    resetStates,
  };
};