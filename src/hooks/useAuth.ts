import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  empresa: string;
  departamento: string;
  cargo: string;
  unidade: string;
  role: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();

  // Remove dependência do toast para evitar loop infinito
  const fetchUserProfile = useCallback(async (email: string) => {
    try {
      console.log('useAuth - Buscando perfil para:', email);
      
      // Buscar dados da inscrição
      const { data: inscricao, error: inscricaoError } = await supabase
        .from('inscricoes_mentoria')
        .select('*')
        .eq('email', email)
        .eq('ativo', true)
        .limit(1)
        .maybeSingle();

      if (inscricaoError) {
        console.error('useAuth - Erro ao buscar inscrição:', inscricaoError);
        setProfile(null);
        return;
      }

      if (!inscricao) {
        console.error('useAuth - Inscrição não encontrada para:', email);
        setProfile(null);
        return;
      }

      // Buscar role do usuário - usar array para permitir que não tenha role
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', inscricao.id)
        .eq('active', true);

      if (roleError) {
        console.error('useAuth - Erro ao buscar role:', roleError);
      }

      // Usar a primeira role ativa ou 'aluno' como padrão
      const userRole = userRoles && userRoles.length > 0 ? userRoles[0].role : 'aluno';

      const newProfile = {
        id: inscricao.id,
        nome: inscricao.nome,
        email: inscricao.email,
        empresa: inscricao.empresa,
        departamento: inscricao.departamento,
        cargo: inscricao.cargo,
        unidade: inscricao.unidade,
        role: userRole,
      };

      console.log('useAuth - Perfil carregado:', newProfile);
      setProfile(newProfile);
      
    } catch (error) {
      console.error('useAuth - Erro ao buscar perfil do usuário:', error);
    }
  }, []); // Remover dependências para evitar loops

  useEffect(() => {
    let isInitialized = false;
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        // Check existing session FIRST
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!isMounted || isLoggingOut) return;
        
        console.log('useAuth - Sessão inicial:', initialSession ? 'encontrada' : 'não encontrada');
        
        // Set initial state immediately
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user && initialSession.user.email) {
          await fetchUserProfile(initialSession.user.email);
        }
        
        // CRITICAL: Always resolve loading after initial check
        setLoading(false);
        isInitialized = true;
        
      } catch (error) {
        console.error('Error in initial auth check:', error);
        if (isMounted) {
          setLoading(false);
          isInitialized = true;
        }
      }
    };

    // Set up auth state listener 
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('useAuth - Auth state change:', event, session?.user?.email);
        
        // Se estamos fazendo logout, ignorar mudanças de estado
        if (isLoggingOut && event !== 'SIGNED_OUT') {
          console.log('useAuth - Ignorando auth state change durante logout');
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Buscar perfil sempre que há uma sessão válida (após inicialização)
        if (session?.user && session.user.email && isInitialized && !isLoggingOut) {
          console.log('useAuth - Buscando perfil após auth change');
          setTimeout(() => {
            if (isMounted && !isLoggingOut) {
              fetchUserProfile(session.user.email);
            }
          }, 0);
        } else if (!session?.user) {
          console.log('useAuth - Limpando perfil - sem usuário');
          setProfile(null);
        }
        
        // Ensure loading is resolved if not already
        if (!isInitialized) {
          setLoading(false);
          isInitialized = true;
        }
      }
    );

    // Initialize immediately
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, isLoggingOut]);

  const signIn = async (email: string, password: string) => {
    try {
      // Tentar fazer login no Supabase Auth diretamente
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: 'Erro ao fazer login',
          description: 'Email ou senha incorretos.',
          variant: 'destructive',
        });
        return { error };
      }

      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo(a)!',
      });

      return { error: null };
    } catch (error) {
      console.error('Erro no login:', error);
      toast({
        title: 'Erro no sistema',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    // Funcionalidade removida - apenas login é permitido
    toast({
      title: 'Funcionalidade não disponível',
      description: 'Para ter acesso, entre em contato com o administrador.',
      variant: 'destructive',
    });
    return { error: { message: 'Signup não disponível' } };
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('🔄 INICIANDO resetPassword para:', email);
      
      // TESTE: Usar APENAS o fallback nativo por enquanto
      console.log('🔄 Usando SOMENTE fallback nativo do Supabase...');
      const redirectTo = `${window.location.origin}/#/alterar-senha`;
      console.log('Redirect URL configurado como:', redirectTo);
      
      const { error: fallbackError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo
      });

      console.log('📊 Resultado do fallback nativo:', { fallbackError });

      if (fallbackError) {
        console.error('❌ Fallback falhou:', fallbackError);
        toast({
          title: 'Erro ao enviar email',
          description: fallbackError.message || 'Erro interno',
          variant: 'destructive',
        });
        return { error: fallbackError };
      }

      console.log('✅ Reset via fallback nativo executado com sucesso');
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });

      return { error: null };
      
    } catch (error: any) {
      console.error('💥 Erro no catch do resetPassword:', error);
      console.error('Stack trace:', error.stack);
      
      toast({
        title: 'Erro no sistema',
        description: error.message || 'Erro interno',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signOut = async () => {
    // Evitar múltiplos cliques
    if (logoutLoading || isLoggingOut) return;
    
    try {
      setLogoutLoading(true);
      setIsLoggingOut(true);
      console.log('Iniciando processo de logout...');
      
      // PRIMEIRO: Limpar estado local imediatamente
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem('dashboard-tab-initialized');
      
      console.log('Estado local limpo');
      
      // SEGUNDO: Fazer logout do Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error && !error.message?.includes('session')) {
        console.error('Erro no logout do Supabase:', error);
      } else {
        console.log('Logout do Supabase realizado');
      }
      
      // TERCEIRO: Mostrar feedback e redirecionar
      toast({
        title: 'Logout realizado',
        description: 'Até logo!',
      });
      
      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        console.log('Redirecionando para home...');
        window.location.replace('/');
      }, 200);
      
    } catch (error: any) {
      console.error('Erro durante logout:', error);
      
      // Garantir limpeza mesmo com erro
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem('dashboard-tab-initialized');
      
      toast({
        title: 'Logout realizado',
        description: 'Até logo!',
      });
      
      setTimeout(() => {
        window.location.replace('/');
      }, 200);
    } finally {
      setLogoutLoading(false);
      setIsLoggingOut(false);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    logoutLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
};