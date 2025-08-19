// ARQUIVO DE TESTE ISOLADO PARA DEBUG
import React from 'react';
import { supabase } from '@/integrations/supabase/client';

export const TestAuthDebug = () => {
  
  const testResetPasswordDirect = async () => {
    console.log('=== TESTE DIRETO SUPABASE AUTH ===');
    
    try {
      // 1. Testar método resetPasswordForEmail diretamente
      console.log('1. Chamando resetPasswordForEmail...');
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        'fernando.costa@mentoriafutura.com.br',
        {
          redirectTo: `${window.location.origin}/auth?type=recovery`,
        }
      );
      
      console.log('2. Resultado completo:', { data, error });
      
      if (error) {
        console.error('❌ ERRO SUPABASE:', {
          message: error.message,
          status: error.status,
          code: error.code || 'NO_CODE'
        });
        alert('ERRO SUPABASE: ' + error.message);
      } else {
        console.log('✅ SUCESSO SUPABASE');
        alert('SUCESSO SUPABASE: Email de reset enviado!');
      }
      
    } catch (err: any) {
      console.error('💥 ERRO NA FUNÇÃO:', err);
      alert('ERRO NA FUNÇÃO: ' + err.message);
    }
  };

  const testSignInDirect = async () => {
    console.log('=== TESTE LOGIN DIRETO ===');
    
    try {
      // Testar login com senha padrão
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'fernando.costa@mentoriafutura.com.br',
        password: 'Mudar@123'
      });
      
      console.log('Login resultado:', { data, error });
      
      if (error) {
        alert('ERRO LOGIN: ' + error.message);
      } else {
        alert('SUCESSO LOGIN!');
      }
      
    } catch (err: any) {
      console.error('Erro login:', err);
      alert('ERRO LOGIN CATCH: ' + err.message);
    }
  };

  const checkCurrentSession = async () => {
    console.log('=== VERIFICAR SESSÃO ATUAL ===');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('Sessão atual:', { session, error });
    alert('Sessão: ' + (session ? 'LOGADO como ' + session.user.email : 'NÃO LOGADO'));
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      background: 'white', 
      padding: '20px', 
      zIndex: 9999,
      border: '2px solid red'
    }}>
      <h3>🔧 TESTE DE AUTENTICAÇÃO</h3>
      <button onClick={checkCurrentSession} style={{ margin: '5px', padding: '10px' }}>
        Verificar Sessão
      </button>
      <button onClick={testSignInDirect} style={{ margin: '5px', padding: '10px' }}>
        Testar Login
      </button>
      <button onClick={testResetPasswordDirect} style={{ margin: '5px', padding: '10px' }}>
        Testar Reset Senha
      </button>
    </div>
  );
};