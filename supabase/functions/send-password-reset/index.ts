import React from 'npm:react@18.3.1'
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'
import { ResetPasswordEmail } from './templates/reset-password.tsx'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();
    console.log('Password reset request for:', email);

    // Verificar se o usuário existe na tabela inscricoes_mentoria
    const { data: userExists, error: userError } = await supabase
      .from('inscricoes_mentoria')
      .select('nome, email, ativo')
      .eq('email', email)
      .eq('ativo', true)
      .single();

    if (userError || !userExists) {
      console.log('Usuário não encontrado:', email);
      // Retornar sucesso mesmo se usuário não existir (por segurança)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Usuário encontrado:', userExists.nome);

    // Gerar link de redefinição usando Supabase Auth
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'supabase.co')}/auth/v1/verify?redirect_to=${encodeURIComponent(window?.location?.origin || 'http://localhost:5173')}/auth`
      }
    });

    if (resetError) {
      console.error('Erro ao gerar link de reset:', resetError);
      throw resetError;
    }

    console.log('Link de reset gerado com sucesso');

    // Renderizar template de email
    const html = await renderAsync(
      React.createElement(ResetPasswordEmail, {
        nome: userExists.nome,
        resetLink: resetData.properties?.action_link || '#'
      })
    );

    // Enviar email
    const emailResponse = await resend.emails.send({
      from: "IA na Prática <noreply@mentoriafutura.com.br>",
      to: [email],
      subject: "Redefinição de Senha - IA na Prática",
      html: html,
    });

    console.log("Email enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Email de redefinição enviado com sucesso"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Erro na função send-password-reset:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro interno do servidor"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);