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
      const { data: inscricao, error: inscricaoError } = await supabase
        .from('inscricoes_mentoria')
        .select('*')
        .eq('email', email)
        .eq('ativo', true)
        .single();

      if (inscricaoError) throw inscricaoError;

      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', inscricao.id)
        .eq('active', true)
        .single();

      if (roleError) throw roleError;

      setProfile({
        id: inscricao.id,
        nome: inscricao.nome,
        email: inscricao.email,
        empresa: inscricao.empresa,
        departamento: inscricao.departamento,
        cargo: inscricao.cargo,
        unidade: inscricao.unidade,
        role: userRole.role,
      });
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    toast({
      title: 'Login realizado com sucesso!',
      description: 'Bem-vindo de volta!',
    });

    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      toast({
        title: 'Erro ao criar conta',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    toast({
      title: 'Conta criada com sucesso!',
      description: 'Verifique seu email para confirmar a conta.',
    });

    return { error: null };
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
  };
};