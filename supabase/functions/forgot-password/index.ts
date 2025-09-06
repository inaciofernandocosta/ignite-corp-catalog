import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('🚀 Forgot Password Function started');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ 
      error: "Method not allowed",
      success: false 
    }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { email } = await req.json();
    console.log(`📧 Processing forgot password for: ${email}`);
    
    if (!email) {
      return new Response(JSON.stringify({ 
        error: "Email é obrigatório",
        success: false 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user exists and is eligible for password reset
    const { data: userCheck, error: checkError } = await supabase
      .from('users_eligible_for_reset')
      .select('*')
      .eq('email', email)
      .single();

    if (checkError || !userCheck || !userCheck.can_reset_password) {
      console.log('User not eligible for password reset:', email);
      // Still return success to prevent email enumeration
      return new Response(JSON.stringify({ 
        message: 'Se este email estiver cadastrado, você receberá as instruções de recuperação',
        success: true
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send password reset email using Supabase Auth
    const redirectTo = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '')}.lovable.app/#/alterar-senha`;
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo
    });

    if (resetError) {
      console.error('Error sending reset email:', resetError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao enviar email de recuperação',
        success: false 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`✅ Password reset email sent to: ${email}`);
    
    return new Response(JSON.stringify({ 
      message: 'Link de recuperação enviado para seu email',
      success: true
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('💥 Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      success: false 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});