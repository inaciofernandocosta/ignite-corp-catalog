import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Verificar se temos a API key do Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração de email não encontrada' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const resend = new Resend(resendApiKey);
    const { email, redirectTo } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Verificando usuário no sistema:', email);

    // Check if user exists and is approved
    const { data: userData, error: userError } = await supabase
      .from('inscricoes_mentoria')
      .select('nome, status')
      .eq('email', email.toLowerCase())
      .eq('status', 'aprovado')
      .single();

    console.log('👤 Dados do usuário:', { userData, userError });

    if (userError || !userData) {
      console.log('❌ Usuário não encontrado ou não aprovado');
      // Return success to avoid email enumeration
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Se o email estiver cadastrado, você receberá as instruções.' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Usuário encontrado e aprovado:', userData.nome);

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    console.log('🎫 Gerando token de reset:', resetToken);

    // Store reset token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_email: email.toLowerCase(),
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (tokenError) {
      console.error('❌ Erro ao salvar token:', tokenError);
      throw new Error('Erro interno do servidor');
    }

    // Create reset link
    const resetLink = `${redirectTo}?token=${resetToken}`;

    console.log('🔗 Link de reset criado:', resetLink);

    // Create professional email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinição de Senha - Mentoria Futura</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc;">
        <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: #ff6b35;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Mentoria Futura</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Educação Corporativa</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Redefinição de Senha</h2>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá <strong>${userData.nome.split(' ')[0]}</strong>,
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Recebemos uma solicitação para redefinir a senha da sua conta na Mentoria Futura. 
                Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #ff6b35; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                  Redefinir Minha Senha
                </a>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 20px 0; text-align: center;">
                <strong>Este link expira em 1 hora por questões de segurança.</strong>
              </p>

              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Se você não solicitou a redefinição de senha, pode ignorar este email com segurança. 
                Sua senha não será alterada.
              </p>

              <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 30px 0;">

              <p style="color: #666666; font-size: 14px; line-height: 1.6; text-align: center; margin: 0;">
                <strong>Mentoria Futura</strong><br>
                Educação Corporativa<br>
                Este é um email automático, não responda a esta mensagem.
              </p>

              <p style="color: #888888; font-size: 12px; line-height: 1.6; text-align: center; margin: 30px 0 0 0;">
                Se você está tendo problemas para clicar no botão, copie e cole a URL abaixo no seu navegador:<br>
                <a href="${resetLink}" style="color: #ff6b35; word-break: break-all;">${resetLink}</a>
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Mentoria Futura <no-reply@mentoriafutura.com.br>",
      to: [email],
      subject: "Redefinição de Senha - Mentoria Futura",
      html: emailHtml,
    });

    console.log("📧 Email enviado com sucesso:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de recuperação enviado com sucesso!' 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("💥 Erro no processo:", error);
    return new Response(
      JSON.stringify({ 
        error: "Erro interno do servidor", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);