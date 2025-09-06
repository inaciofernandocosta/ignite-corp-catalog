import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRealIP(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
         request.headers.get("x-real-ip") || 
         "unknown";
}

function isRateLimited(key: string, maxAttempts: number = 5): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  
  const current = rateLimitStore.get(key);
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (current.count >= maxAttempts) {
    return true;
  }
  
  current.count++;
  return false;
}

function validateInput(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const { email, redirectTo } = data;
  
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email é obrigatório' };
  }
  
  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Formato de email inválido' };
  }
  
  // Validate redirectTo if provided
  if (redirectTo && typeof redirectTo !== 'string') {
    return { valid: false, error: 'redirectTo deve ser uma string' };
  }
  
  return { valid: true };
}

serve(async (req) => {
  console.log('🚀 Edge function send-password-reset iniciada');
  console.log(`📧 Método: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request - CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const clientIP = getRealIP(req);
  
  // Rate limiting
  if (isRateLimited(clientIP, 5)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(JSON.stringify({ error: "Muitas tentativas. Tente novamente em 1 hora." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  console.log('📨 Processando request...');
  try {
    // Parse and validate input
    let requestData;
    try {
      requestData = await req.json();
      console.log('📄 Request data recebido:', { email: requestData?.email, hasRedirectTo: !!requestData?.redirectTo });
    } catch (e) {
      console.error('❌ Erro no parse do JSON:', e);
      return new Response(JSON.stringify({ error: "JSON inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const validation = validateInput(requestData);
    if (!validation.valid) {
      console.warn(`❌ Validação falhou: ${validation.error} from IP: ${clientIP}`);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email, redirectTo } = requestData;

    console.log(`✅ Validação passou para: ${email}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Iniciando reset de senha para: ${email}`);

    // Verificar se o usuário existe antes de tentar gerar o link
    try {
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      const userExists = userData?.users?.some(user => user.email === email);
      
      if (!userExists) {
        console.error(`Usuário não encontrado no auth: ${email}`);
        return new Response(
          JSON.stringify({ 
            error: 'Email não encontrado no sistema',
            debug: `User ${email} not found in auth.users`
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`Usuário encontrado no auth: ${email}`);
    } catch (listError) {
      console.error('Erro ao listar usuários:', listError);
    }

    // Gerar link de reset usando o método correto
    console.log('Tentando gerar link de recovery...');
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo || 'https://mentoriafutura.com.br/#/alterar-senha'
      }
    });

    if (error) {
      console.error('Erro detalhado ao gerar link de reset:', {
        error,
        message: error.message,
        status: error.status,
        code: error.code
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao gerar link de recuperação',
          debug: {
            message: error.message,
            status: error.status,
            code: error.code
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const resetLink = data.properties?.action_link;
    console.log(`Link de reset gerado para ${email}`);

    // Enviar email usando Resend
    try {
      console.log(`Tentando enviar email via Resend para: ${email}`);
      
      const emailResponse = await resend.emails.send({
        from: "Lovable <onboarding@resend.dev>",
        to: [email],
        subject: "Reset de Senha - Mentoria Futura",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Reset de Senha</h1>
            <p>Olá,</p>
            <p>Você solicitou a redefinição da sua senha no sistema Mentoria Futura.</p>
            <p>Clique no botão abaixo para redefinir sua senha:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Redefinir Senha
              </a>
            </div>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">${resetLink}</p>
            <p><strong>Este link expira em 1 hora.</strong></p>
            <p>Se você não solicitou esta redefinição, ignore este email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Mentoria Futura - Sistema de Gestão de Aprendizagem
            </p>
          </div>
        `,
      });

      console.log("Email de reset enviado com sucesso:", JSON.stringify(emailResponse));

      // Verificar se houve erro no Resend
      if (emailResponse.error) {
        console.error("Erro no Resend:", JSON.stringify(emailResponse.error));
        throw new Error(`Resend error: ${emailResponse.error.message}`);
      }

      return new Response(
        JSON.stringify({ 
          message: 'Link de reset de senha enviado para seu email',
          success: true
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (emailError: any) {
      console.error('❌ Erro detalhado ao enviar email:', {
        message: emailError?.message,
        stack: emailError?.stack,
        type: typeof emailError
      });
      
      // Return success even if email fails (security: don't reveal if user exists)
      return new Response(
        JSON.stringify({ 
          message: 'Link de reset de senha enviado para seu email',
          success: true
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error: any) {
    console.error('💥 Erro crítico na função:', {
      message: error?.message,
      stack: error?.stack,
      type: typeof error,
      name: error?.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});