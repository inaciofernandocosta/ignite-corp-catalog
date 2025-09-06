import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('🚀 Confirm Password Reset Function iniciada');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { token, newPassword } = await req.json();
    console.log(`🔐 Processando reset de senha com token: ${token?.substring(0, 10)}...`);
    
    if (!token || !newPassword) {
      console.log('❌ Token ou senha não fornecidos');
      return new Response(JSON.stringify({ 
        success: false,
        error: "Token e nova senha são obrigatórios" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validar força da senha
    if (newPassword.length < 8) {
      console.log('❌ Senha muito fraca');
      return new Response(JSON.stringify({ 
        success: false,
        error: "A senha deve ter pelo menos 8 caracteres" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Inicializar Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('✅ Supabase client inicializado');

    // Verificar se token existe e é válido (usar user_email)
    console.log('🔍 Buscando token na tabela...');
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (tokenError) {
      console.log('❌ Erro ao buscar token:', tokenError);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Token inválido ou expirado" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!tokenData) {
      console.log('❌ Token não encontrado ou inválido');
      return new Response(JSON.stringify({ 
        success: false,
        error: "Token inválido ou expirado" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`✅ Token encontrado para: ${tokenData.user_email}`);

    // Normalizar email
    const normalizedEmail = tokenData.user_email.trim().toLowerCase();
    console.log(`🔍 Buscando usuário: ${normalizedEmail}`);

    // Buscar usuário na inscricoes_mentoria
    const { data: user, error: userError } = await supabase
      .from('inscricoes_mentoria')
      .select('id, email, nome')
      .eq('email', normalizedEmail)
      .eq('ativo', true)
      .eq('status', 'aprovado')
      .maybeSingle();

    if (userError || !user) {
      console.log('❌ Usuário não encontrado na inscrições:', userError);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Usuário não encontrado ou não aprovado" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`✅ Usuário encontrado: ${user.nome} (${user.email})`);

    // Buscar user_id diretamente na view users_eligible_for_reset
    console.log('🔍 Buscando user_id na view users_eligible_for_reset...');
    
    const { data: eligibleUser, error: eligibleError } = await supabase
      .from('users_eligible_for_reset')
      .select('user_id, email, can_reset_password')
      .eq('email', normalizedEmail)
      .eq('can_reset_password', true)
      .maybeSingle();

    if (eligibleError || !eligibleUser) {
      console.log('❌ Usuário não elegível para reset:', eligibleError);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Usuário não encontrado ou não elegível para reset de senha" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!eligibleUser.user_id) {
      console.log('❌ User ID não encontrado para:', normalizedEmail);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Conta de autenticação não encontrada" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const authUserId = eligibleUser.user_id;
    console.log(`✅ Auth user_id encontrado: ${authUserId} para email: ${normalizedEmail}`);

    // Atualizar senha do usuário - usando abordagem mais robusta
    console.log(`🔄 Atualizando senha para user ID: ${authUserId}`);
    
    try {
      // Primeira tentativa: updateUserById normal
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authUserId,
        { password: newPassword }
      );

      if (updateError) {
        console.log('⚠️ Primeira tentativa falhou:', updateError.message);
        
        // Segunda tentativa: recrear o usuário se necessário
        if (updateError.message.includes('Database error loading user')) {
          console.log('🔄 Tentando abordagem alternativa...');
          
          // Deletar e recriar usuário auth
          try {
            await supabase.auth.admin.deleteUser(authUserId);
            console.log('✅ Usuário auth deletado');
          } catch (deleteError) {
            console.log('⚠️ Erro ao deletar (pode não existir):', deleteError);
          }
          
          // Criar novo usuário auth
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: normalizedEmail,
            password: newPassword,
            email_confirm: true,
            user_metadata: { nome: user.nome }
          });
          
          if (createError) {
            console.error('❌ Erro ao recriar usuário:', createError);
            return new Response(JSON.stringify({ 
              success: false,
              error: "Erro ao recriar conta de autenticação: " + createError.message 
            }), {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
          
          console.log('✅ Usuário auth recriado com sucesso');
          
        } else {
          console.error('❌ Erro ao atualizar senha:', updateError);
          return new Response(JSON.stringify({ 
            success: false,
            error: "Erro ao atualizar senha: " + updateError.message 
          }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
    } catch (generalError: any) {
      console.error('❌ Erro geral na atualização:', generalError);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Erro interno ao atualizar senha" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('✅ Senha atualizada no auth.users');

    // Marcar token como usado
    console.log('🔄 Marcando token como usado...');
    const { error: tokenUpdateError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', token);

    if (tokenUpdateError) {
      console.log('⚠️ Erro ao marcar token como usado:', tokenUpdateError);
      // Não falhar aqui, pois a senha já foi atualizada
    } else {
      console.log('✅ Token marcado como usado');
    }

    console.log(`🎉 Reset de senha completo para: ${user.email}`);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Senha atualizada com sucesso!"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('💥 Erro geral:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: "Erro interno do servidor" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});