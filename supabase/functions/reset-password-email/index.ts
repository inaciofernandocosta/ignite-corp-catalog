import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('🚀 Reset Password Email Function iniciada');
  
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
    const { email } = await req.json();
    console.log(`📧 Processando reset para: ${email}`);
    
    if (!email) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Email é obrigatório" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Formato de email inválido" 
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

    // Verificar se usuário existe e está ativo
    console.log('Verificando usuário no banco de dados...');
    const { data: user, error: userError } = await supabase
      .from('inscricoes_mentoria')
      .select('id, email, nome, ativo, status')
      .eq('email', email)
      .eq('ativo', true)
      .eq('status', 'aprovado')
      .single();

    if (userError || !user) {
      console.log(`Usuário não encontrado ou não elegível: ${email}, erro:`, userError);
      // Retornar sucesso para evitar vazamento de informações
      return new Response(JSON.stringify({ 
        success: true,
        message: "Se este email estiver registrado, você receberá as instruções de recuperação."
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('✅ Usuário válido encontrado:', user.nome);

    // Verificar se API key do Resend está disponível
    const resendKey = Deno.env.get("RESEND_API_KEY");
    console.log('RESEND_API_KEY disponível:', resendKey ? 'SIM' : 'NÃO');
    console.log('Todas as env vars:', Object.keys(Deno.env.toObject()).filter(k => k.includes('RESEND')));
    
    if (!resendKey) {
      console.error('❌ RESEND_API_KEY não encontrada nas variáveis de ambiente');
      return new Response(JSON.stringify({ 
        success: false,
        error: "Serviço de email não configurado" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Gerar token de recuperação único
    console.log('Gerando token de recuperação...');
    const resetToken = crypto.randomUUID() + '-' + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    console.log('Token gerado:', resetToken.substring(0, 10) + '...');
    console.log('Expira em:', expiresAt.toISOString());

    // Salvar token na tabela de tokens
    console.log('Salvando token no banco...');
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .upsert({
        email: email,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (tokenError) {
      console.error('❌ Erro ao salvar token:', tokenError);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Erro interno do servidor" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('✅ Token salvo com sucesso');

    // Enviar email via Resend
    console.log('Inicializando Resend...');
    const resend = new Resend(resendKey);
    const resetUrl = `https://preview--ignite-corp-catalog.lovable.app/#/resetar-senha?token=${resetToken}`;
    
    console.log('URL de reset:', resetUrl);
    console.log('Enviando email...');
    
    const { error: emailError } = await resend.emails.send({
      from: "Mentoria Futura <onboarding@resend.dev>",
      to: [email],
      subject: "Redefinir sua senha - Mentoria Futura",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinir Senha</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                Mentoria Futura
              </h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">
                Redefinição de Senha
              </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                Olá, ${user.nome}!
              </h2>
              
              <p style="color: #6b7280; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha:
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Redefinir Minha Senha
                </a>
              </div>
              
              <!-- Security Info -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 4px;">
                <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
                  ⚠️ Informações de Segurança
                </h3>
                <ul style="color: #92400e; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5;">
                  <li>Este link expira em <strong>1 hora</strong></li>
                  <li>Use apenas se você solicitou esta alteração</li>
                  <li>Nunca compartilhe este link com outras pessoas</li>
                </ul>
              </div>
              
              <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0;">
                Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá inalterada.
              </p>
              
              <!-- Direct Link -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  Não consegue clicar no botão? Copie e cole este link no seu navegador:
                </p>
                <p style="color: #6366f1; font-size: 12px; word-break: break-all; margin: 5px 0 0 0;">
                  ${resetUrl}
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 Mentoria Futura. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
      console.error('❌ Detalhes do erro:', JSON.stringify(emailError));
      return new Response(JSON.stringify({ 
        success: false,
        error: "Erro ao enviar email" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`✅ Email de reset enviado com sucesso para: ${email}`);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Email de recuperação enviado com sucesso!"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('💥 Erro geral:', error);
    console.error('💥 Stack trace:', error.stack);
    console.error('💥 Tipo do erro:', typeof error);
    console.error('💥 Nome do erro:', error.name);
    console.error('💥 Mensagem:', error.message);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: "Erro interno do servidor",
      debug: {
        message: error.message,
        name: error.name,
        type: typeof error
      }
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});