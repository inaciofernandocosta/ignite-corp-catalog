import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncResult {
  email: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  details?: any;
}

interface SyncResponse {
  success: boolean;
  action: string;
  processedCount: number;
  results: SyncResult[];
  summary: {
    success: number;
    error: number;
    skipped: number;
  };
}

export const useAdminSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResults, setLastResults] = useState<SyncResponse | null>(null);
  const { toast } = useToast();

  const diagnoseUsers = async (emails: string[]): Promise<SyncResponse | null> => {
    setIsLoading(true);
    try {
      console.log('🔍 Diagnosticando usuários:', emails);
      
      const { data, error } = await supabase.functions.invoke('admin-sync-auth-users', {
        body: {
          emails,
          action: 'diagnose'
        }
      });

      if (error) {
        console.error('❌ Erro na diagnose:', error);
        toast({
          title: 'Erro na diagnose',
          description: error.message || 'Erro desconhecido',
          variant: 'destructive',
        });
        return null;
      }

      console.log('📊 Resultados da diagnose:', data);
      setLastResults(data);

      const { summary } = data;
      toast({
        title: 'Diagnose concluída',
        description: `✅ ${summary.success} OK, ❌ ${summary.error} com problemas, ⏭️ ${summary.skipped} ignorados`,
      });

      return data;
    } catch (error: any) {
      console.error('💥 Erro no diagnose:', error);
      toast({
        title: 'Erro',
        description: 'Falha na comunicação com o servidor',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const syncUsers = async (emails: string[]): Promise<SyncResponse | null> => {
    setIsLoading(true);
    try {
      console.log('🔄 Sincronizando usuários:', emails);
      
      const { data, error } = await supabase.functions.invoke('admin-sync-auth-users', {
        body: {
          emails,
          action: 'sync'
        }
      });

      if (error) {
        console.error('❌ Erro na sincronização:', error);
        toast({
          title: 'Erro na sincronização',
          description: error.message || 'Erro desconhecido',
          variant: 'destructive',
        });
        return null;
      }

      console.log('📊 Resultados da sincronização:', data);
      setLastResults(data);

      const { summary } = data;
      toast({
        title: 'Sincronização concluída',
        description: `✅ ${summary.success} criados, ❌ ${summary.error} com erro, ⏭️ ${summary.skipped} ignorados`,
      });

      return data;
    } catch (error: any) {
      console.error('💥 Erro na sync:', error);
      toast({
        title: 'Erro',
        description: 'Falha na comunicação com o servidor',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const syncAllApproved = async (): Promise<SyncResponse | null> => {
    setIsLoading(true);
    try {
      console.log('🔄 Sincronizando todos os usuários aprovados');
      
      const { data, error } = await supabase.functions.invoke('admin-sync-auth-users', {
        body: {
          action: 'sync_all_approved'
        }
      });

      if (error) {
        console.error('❌ Erro na sincronização geral:', error);
        toast({
          title: 'Erro na sincronização geral',
          description: error.message || 'Erro desconhecido',
          variant: 'destructive',
        });
        return null;
      }

      console.log('📊 Resultados da sincronização geral:', data);
      setLastResults(data);

      const { summary } = data;
      toast({
        title: 'Sincronização geral concluída',
        description: `Processados ${data.processedCount} usuários: ✅ ${summary.success} criados, ❌ ${summary.error} com erro, ⏭️ ${summary.skipped} ignorados`,
      });

      return data;
    } catch (error: any) {
      console.error('💥 Erro na sync geral:', error);
      toast({
        title: 'Erro',
        description: 'Falha na comunicação com o servidor',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    lastResults,
    diagnoseUsers,
    syncUsers,
    syncAllApproved,
  };
};