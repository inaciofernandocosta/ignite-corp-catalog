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

    // Verificar se token existe e é válido
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      console.log('Token inválido ou expirado:', token);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Token inválido ou expirado" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Buscar usuário
    const { data: user, error: userError } = await supabase
      .from('inscricoes_mentoria')
      .select('id, email, nome')
      .eq('email', tokenData.user_email)
      .eq('ativo', true)
      .eq('status', 'aprovado')
      .single();

    if (userError || !user) {
      console.log('Usuário não encontrado:', tokenData.user_email);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Usuário não encontrado" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verificar se usuário existe no auth.users
    const { data: authUser, error: authUserError } = await supabase.auth.admin.listUsers({
      filter: `email.eq.${user.email}`
    });

    if (authUserError || !authUser.users.length) {
      console.log('Usuário não encontrado no auth.users:', user.email);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Conta de autenticação não encontrada" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const authUserId = authUser.users[0].id;

    // Atualizar senha do usuário
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUserId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Erro ao atualizar senha" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Marcar token como usado
    await supabase
      .from('password_reset_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', token);

    console.log(`✅ Senha atualizada com sucesso para: ${user.email}`);
    
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