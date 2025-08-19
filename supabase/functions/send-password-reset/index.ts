import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PasswordResetRequest {
  email: string;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_ATTEMPTS_PER_EMAIL = 3;
const MAX_ATTEMPTS_PER_IP = 5;

// In-memory rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { attempts: number; lastAttempt: number }>();

function getRealIP(req: Request): string {
  // Check various headers for the real IP
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  const cfConnectingIP = req.headers.get("cf-connecting-ip");
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return "unknown";
}

function isRateLimited(key: string, maxAttempts: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record) {
    rateLimitStore.set(key, { attempts: 1, lastAttempt: now });
    return false;
  }
  
  // Reset if window has passed
  if (now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { attempts: 1, lastAttempt: now });
    return false;
  }
  
  // Check if rate limited
  if (record.attempts >= maxAttempts) {
    return true;
  }
  
  // Increment attempts
  record.attempts++;
  record.lastAttempt = now;
  rateLimitStore.set(key, record);
  return false;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Password reset function called - Method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('Handling CORS preflight');
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = getRealIP(req);
    console.log('Password reset request from IP:', clientIP);

    const body = await req.text();
    console.log('Request body:', body);
    
    const { email }: PasswordResetRequest = JSON.parse(body);
    console.log('Password reset request for:', email);

    if (!email) {
      return new Response(JSON.stringify({ 
        success: false,
        error: "Email é obrigatório" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate email format
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

    // Rate limiting checks
    const emailKey = `email:${email}`;
    const ipKey = `ip:${clientIP}`;
    
    if (isRateLimited(emailKey, MAX_ATTEMPTS_PER_EMAIL)) {
      console.log(`Rate limit exceeded for email: ${email}`);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Muitas tentativas para este email. Tente novamente em 1 hora.",
        isRateLimit: true 
      }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    if (isRateLimited(ipKey, MAX_ATTEMPTS_PER_IP)) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Muitas tentativas deste IP. Tente novamente em 1 hora.",
        isRateLimit: true 
      }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verificar se o usuário existe usando função segura
    console.log('Verificando se usuário existe...');
    const { data: userExists, error: userError } = await supabase
      .rpc('email_exists_for_recovery', { email_to_check: email });

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

    console.log('Usuário existe no sistema');

    // Gerar link de redefinição usando Supabase Auth com URL fixa para segurança
    const redirectUrl = `https://fauoxtziffljgictcvhi.supabase.co/auth/v1/verify`;
    console.log('Redirect URL:', redirectUrl);
    
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (resetError) {
      console.error('Erro ao gerar link de reset:', resetError);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Erro ao gerar link de recuperação" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Link de reset gerado com sucesso');

    // Template de email profissional e responsivo
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinição de Senha - IA na Prática</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body {
              margin: 0;
              padding: 0;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #f8fafc;
              line-height: 1.6;
            }
            
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 48px 40px;
              text-align: center;
              color: white;
            }
            
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
              letter-spacing: -0.025em;
            }
            
            .header p {
              margin: 8px 0 0 0;
              font-size: 16px;
              opacity: 0.9;
              font-weight: 400;
            }
            
            .content {
              padding: 48px 40px;
            }
            
            .greeting {
              font-size: 18px;
              font-weight: 600;
              color: #1f2937;
              margin: 0 0 24px 0;
            }
            
            .message {
              font-size: 16px;
              color: #4b5563;
              margin: 0 0 32px 0;
              line-height: 1.7;
            }
            
            .cta-container {
              text-align: center;
              margin: 40px 0;
            }
            
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              letter-spacing: 0.025em;
              transition: all 0.3s ease;
              box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.4);
            }
            
            .cta-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px 0 rgba(102, 126, 234, 0.5);
            }
            
            .security-notice {
              background-color: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 8px;
              padding: 16px;
              margin: 32px 0;
            }
            
            .security-notice p {
              margin: 0;
              font-size: 14px;
              color: #92400e;
              font-weight: 500;
            }
            
            .footer {
              background-color: #f9fafb;
              padding: 32px 40px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            
            .footer p {
              margin: 8px 0;
              font-size: 14px;
              color: #6b7280;
            }
            
            .footer .brand {
              font-weight: 600;
              color: #374151;
              font-size: 16px;
            }
            
            .social-links {
              margin: 24px 0 16px 0;
            }
            
            .social-links a {
              display: inline-block;
              margin: 0 8px;
              color: #6b7280;
              text-decoration: none;
              font-size: 14px;
            }
            
            @media only screen and (max-width: 600px) {
              .container {
                margin: 0;
                border-radius: 0;
              }
              
              .header, .content, .footer {
                padding: 32px 24px;
              }
              
              .header h1 {
                font-size: 24px;
              }
              
              .cta-button {
                padding: 14px 28px;
                font-size: 15px;
              }
            }
          </style>
        </head>
        <body>
          <div style="padding: 40px 20px;">
            <div class="container">
              <div class="header">
                <h1>🔐 Redefinição de Senha</h1>
                <p>Solicitação de alteração de credenciais</p>
              </div>
              
              <div class="content">
                <p class="greeting">Olá! 👋</p>
                
                <p class="message">
                  Recebemos uma solicitação para redefinir a senha da sua conta na plataforma <strong>IA na Prática</strong>. 
                  Para continuar com o processo, clique no botão abaixo para criar sua nova senha de forma segura.
                </p>
                
                <div class="cta-container">
                  <a href="${resetData.properties?.action_link || '#'}" class="cta-button">
                    🔄 Redefinir Minha Senha
                  </a>
                </div>
                
                <div class="security-notice">
                  <p>
                    ⚠️ <strong>Importante para sua Segurança:</strong><br>
                    • Este link é válido por apenas 1 hora por motivos de segurança<br>
                    • Há um limite de 3 tentativas por email e 5 tentativas por IP por hora<br>
                    • Use uma senha forte com pelo menos 8 caracteres<br>
                    • Não compartilhe este link com ninguém
                  </p>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
                  Se você não solicitou esta redefinição, pode ignorar este email com segurança. 
                  Sua conta permanecerá protegida e nenhuma alteração será feita.
                </p>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 16px;">
                  Para sua segurança, nosso sistema possui proteções contra tentativas excessivas de redefinição. 
                  Se atingir o limite, aguarde 1 hora antes de tentar novamente.
                </p>
              </div>
              
              <div class="footer">
                <p class="brand">IA na Prática</p>
                <p>Transformando o futuro através da Inteligência Artificial</p>
                
                <div class="social-links">
                  <a href="#" style="margin-right: 16px;">📧 Suporte</a>
                  <a href="#" style="margin-right: 16px;">🌐 Site</a>
                  <a href="#">📱 Contato</a>
                </div>
                
                <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
                  Este é um email automático, não responda diretamente.<br>
                  © ${new Date().getFullYear()} IA na Prática. Todos os direitos reservados.
                </p>
              </div>
            </div>
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

    console.log('Resposta do Resend:', JSON.stringify(emailResponse, null, 2));

    if (emailResponse.error) {
      console.error('Erro ao enviar email:', emailResponse.error);
      return new Response(JSON.stringify({ 
        success: false,
        error: "Erro ao enviar email" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Email enviado com sucesso!");

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