import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

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
  console.log('Password reset function called');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('Handling CORS preflight');
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
      return new Response(JSON.stringify({ 
        success: true,
        message: "Se o email estiver cadastrado, você receberá as instruções"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Usuário encontrado:', userExists.nome);

    // Gerar link de redefinição usando Supabase Auth
    const redirectUrl = `https://preview--ignite-corp-catalog.lovable.app/auth?type=recovery`;
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (resetError) {
      console.error('Erro ao gerar link de reset:', resetError);
      throw resetError;
    }

    console.log('Link de reset gerado com sucesso');

    // Criar HTML simples para o email (sem React Email por enquanto)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Redefinição de Senha</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f6f9fc; padding: 32px; border-radius: 8px;">
            <h1 style="color: #7c3aed; text-align: center; margin-bottom: 24px;">Redefinição de Senha</h1>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 16px;">Olá ${userExists.nome},</p>
            
            <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
              Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha:
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetData.properties?.action_link || '#'}" 
                 style="background-color: #7c3aed; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Redefinir Senha
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; text-align: center; margin-top: 24px;">
              Este link é válido por 24 horas. Se você não solicitou esta redefinição, ignore este email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 32px 0;">
            
            <p style="font-size: 14px; color: #666; text-align: center; margin: 0;">
              Atenciosamente,<br>
              Equipe IA na Prática
            </p>
          </div>
        </body>
      </html>
    `;

    // Enviar email
    console.log('Tentando enviar email para:', email);
    const emailResponse = await resend.emails.send({
      from: "IA na Prática <onboarding@resend.dev>",
      to: [email],
      subject: "Redefinição de Senha - IA na Prática",
      html: html,
    });

    console.log('Email enviado com sucesso. Resposta completa:', JSON.stringify(emailResponse, null, 2));

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