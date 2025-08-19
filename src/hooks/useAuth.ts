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
        .single();

      if (inscricaoError) {
        console.error('useAuth - Erro ao buscar inscrição:', inscricaoError);
        return;
      }

      if (!inscricao) {
        console.error('useAuth - Inscrição não encontrada para:', email);
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
        
        if (!isMounted) return;
        
        
        
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
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Buscar perfil sempre que há uma sessão válida (após inicialização)
        if (session?.user && session.user.email && isInitialized) {
          console.log('useAuth - Buscando perfil após auth change');
          setTimeout(() => {
            if (isMounted) {
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
  }, [fetchUserProfile]);

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
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email }
      });

      if (error || !data?.success) {
        // Detectar rate limit
        if (data?.isRateLimit || error?.message?.includes('rate limit') || error?.message?.includes('too many requests')) {
          return { error: { ...error, isRateLimit: true } };
        }
        
        toast({
          title: 'Erro ao enviar email',
          description: data?.error || error?.message || 'Erro interno',
          variant: 'destructive',
        });
        return { error: error || { message: data?.error } };
      }

      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });

      return { error: null };
    } catch (error: any) {
      // Detectar rate limit em catch também
      if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
        return { error: { ...error, isRateLimit: true } };
      }
      
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
    if (logoutLoading) return;
    
    try {
      setLogoutLoading(true);
      
      
      // PRIMEIRO: Limpar estado local imediatamente para garantir logout na UI
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem('dashboard-tab-initialized');
      
      // SEGUNDO: Tentar fazer logout do Supabase apenas se existe uma sessão
      const { data: currentSession } = await supabase.auth.getSession();
      
      if (currentSession?.session) {
        
        const { error } = await supabase.auth.signOut();
        
        // Ignorar erros conhecidos de sessão
        if (error && !error.message?.includes('session') && !error.message?.includes('Session') && 
            !error.message?.includes('Auth session missing')) {
          console.error('Erro no logout do Supabase (mas continuando):', error);
        }
      } else {
        
      }
      
      // TERCEIRO: Sempre mostrar sucesso e redirecionar
      
      toast({
        title: 'Logout realizado',
        description: 'Até logo!',
      });
      
      // Forçar redirecionamento para home
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (error: any) {
      console.error('Erro durante logout:', error);
      
      // Mesmo com erro, garantir que o estado seja limpo
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem('dashboard-tab-initialized');
      
      // Sempre mostrar sucesso para o usuário (a limpeza local já foi feita)
      toast({
        title: 'Logout realizado',
        description: 'Até logo!',
      });
      
      // Forçar redirecionamento mesmo com erro
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } finally {
      setLogoutLoading(false);
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