import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAuthAccountRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email }: CreateAuthAccountRequest = await req.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se usuário existe em inscricoes_mentoria
    const { data: usuario, error: userError } = await supabase
      .from('inscricoes_mentoria')
      .select('*')
      .eq('email', email.trim())
      .eq('ativo', true)
      .single();

    if (userError || !usuario) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Usuário não encontrado ou não está ativo' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se já existe no auth.users
    const { data: existingAuth } = await supabase.auth.admin.listUsers();
    const authUserExists = existingAuth.users.some(u => u.email === email.trim());

    if (authUserExists) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Usuário já possui conta de autenticação' 
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Criar conta de auth usando a função segura
    const { data: result, error: createError } = await supabase
      .rpc('criar_conta_auth_segura', {
        user_email: email.trim(),
        user_password: 'TempPassword123!'
      });

    if (createError) {
      console.error('Erro ao criar conta de auth:', createError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro interno ao criar conta de autenticação' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Conta de autenticação criada para ${email}`,
      user: {
        nome: usuario.nome,
        email: usuario.email
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro na função create-auth-account:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);