import { useState, useEffect } from 'react';
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
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.email!);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.email!);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (email: string) => {
    try {
      // Buscar dados da inscrição
      const { data: inscricao, error: inscricaoError } = await supabase
        .from('inscricoes_mentoria')
        .select('*')
        .eq('email', email)
        .eq('ativo', true)
        .single();

      if (inscricaoError) {
        console.error('Erro ao buscar inscrição:', inscricaoError);
        return;
      }

      // Buscar role do usuário - usar array para permitir que não tenha role
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', inscricao.id)
        .eq('active', true);

      if (roleError) {
        console.error('Erro ao buscar role:', roleError);
      }

      // Usar a primeira role ativa ou 'aluno' como padrão
      const userRole = userRoles && userRoles.length > 0 ? userRoles[0].role : 'aluno';

      setProfile({
        id: inscricao.id,
        nome: inscricao.nome,
        email: inscricao.email,
        empresa: inscricao.empresa,
        departamento: inscricao.departamento,
        cargo: inscricao.cargo,
        unidade: inscricao.unidade,
        role: userRole,
      });

      console.log('Perfil carregado:', { email, role: userRole });
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Primeiro verificar se o usuário existe na tabela inscricoes_mentoria
      const { data: inscricao, error: inscricaoError } = await supabase
        .from('inscricoes_mentoria')
        .select('*')
        .eq('email', email)
        .eq('ativo', true)
        .single();

      if (inscricaoError || !inscricao) {
        toast({
          title: 'Usuário não encontrado',
          description: 'Email não cadastrado ou não ativo no sistema.',
          variant: 'destructive',
        });
        return { error: { message: 'Usuário não encontrado' } };
      }

      // Tentar fazer login no Supabase Auth
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
        description: `Bem-vindo(a), ${inscricao.nome}!`,
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
      console.log('useAuth - Iniciando resetPassword para:', email);
      
      // Chamar nossa edge function personalizada para envio de email
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email }
      });

      console.log('useAuth - Resposta da edge function:', { data, error });

      if (error) {
        console.error('useAuth - Erro na edge function:', error);
        
        // Se for erro de rate limit ou conexão, usar método nativo como fallback
        if (error.message?.includes('Failed to fetch') || error.message?.includes('rate limit')) {
          console.log('useAuth - Tentando fallback com método nativo');
          
          // Verificar se usuário existe primeiro
          const { data: userExists } = await supabase
            .from('inscricoes_mentoria')
            .select('email')
            .eq('email', email)
            .eq('ativo', true)
            .single();

          if (!userExists) {
            toast({
              title: 'Email não encontrado',
              description: 'Este email não está cadastrado no sistema.',
              variant: 'destructive',
            });
            return { error: { message: 'Email não encontrado' } };
          }

          // Usar método nativo do Supabase como fallback
          const { error: nativeError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth?reset=true`,
          });

          if (nativeError) {
            console.error('useAuth - Erro no método nativo:', nativeError);
            
            if (nativeError.message?.includes('rate limit')) {
              toast({
                title: 'Muitas tentativas',
                description: 'Aguarde alguns minutos antes de tentar novamente.',
                variant: 'destructive',
              });
              return { error: { message: 'Rate limit excedido' } };
            }
            
            toast({
              title: 'Erro ao enviar email',
              description: nativeError.message,
              variant: 'destructive',
            });
            return { error: nativeError };
          }

          toast({
            title: 'Email enviado!',
            description: 'Verifique sua caixa de entrada para redefinir sua senha.',
          });
          return { error: null };
        }
        
        toast({
          title: 'Erro ao enviar email',
          description: 'Erro interno. Tente novamente mais tarde.',
          variant: 'destructive',
        });
        return { error: { message: 'Erro interno do servidor' } };
      }

      if (!data?.success) {
        console.error('useAuth - Falha na edge function:', data?.error);
        toast({
          title: 'Erro ao enviar email',
          description: data?.error || 'Erro desconhecido.',
          variant: 'destructive',
        });
        return { error: { message: data?.error || 'Erro desconhecido' } };
      }

      console.log('useAuth - Email enviado com sucesso via edge function');
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });

      return { error: null };
    } catch (error: any) {
      console.error('useAuth - Erro geral em resetPassword:', error);
      
      // Se for erro de rate limit, informar ao usuário
      if (error.message?.includes('rate limit')) {
        toast({
          title: 'Muitas tentativas',
          description: 'Aguarde alguns minutos antes de tentar novamente.',
          variant: 'destructive',
        });
        return { error: { message: 'Rate limit excedido' } };
      }
      
      toast({
        title: 'Erro no sistema',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: 'Erro ao sair',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Logout realizado',
        description: 'Até logo!',
      });
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
};