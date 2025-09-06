import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting store (simple in-memory for demo)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface PasswordResetRequest {
  email: string;
  redirectTo?: string;
}

// Security functions
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

function sanitizeString(str: string, maxLength: number = 200): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>"\';]/g, '').substring(0, maxLength).trim();
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Password reset function started');
  console.log(`📧 Method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('✅ OPTIONS request - CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    console.log('❌ Method not allowed:', req.method);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const clientIP = getRealIP(req);
  console.log('📍 Client IP:', clientIP);

  // Rate limiting
  if (isRateLimited(clientIP, 5)) {
    console.warn(`⏰ Rate limit exceeded for IP: ${clientIP}`);
    return new Response(JSON.stringify({ error: "Muitas tentativas. Tente novamente em 1 hora." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Parse and validate input
    let requestData;
    try {
      requestData = await req.json();
      console.log('📄 Request data received for:', requestData?.email);
    } catch (e) {
      console.error('❌ JSON parse error:', e);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const validation = validateInput(requestData);
    if (!validation.valid) {
      console.warn(`❌ Input validation failed: ${validation.error} from IP: ${clientIP}`);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { email, redirectTo }: PasswordResetRequest = requestData;
    const safeEmail = sanitizeString(email);
    const finalRedirectTo = redirectTo || 'https://preview--ignite-corp-catalog.lovable.app/#/alterar-senha';

    console.log(`🔄 Processing password reset for: ${safeEmail}`);
    console.log(`🔗 Redirect URL: ${finalRedirectTo}`);

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Check if user exists in Supabase Auth (securely)
    try {
      const { data: authUsers, error: listError } = await supabaseClient.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Error listing users:', listError);
        throw listError;
      }

      const userExists = authUsers?.users?.some(user => user.email === safeEmail);
      console.log(`👤 User exists in Auth: ${userExists}`);

      if (!userExists) {
        console.log(`⚠️ User not found: ${safeEmail}, but returning success for security`);
        // Return success anyway for security (don't reveal if user exists)
        return new Response(JSON.stringify({ 
          message: 'Link de reset de senha enviado para seu email',
          success: true
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

    } catch (userCheckError: any) {
      console.error('❌ Error checking user existence:', userCheckError);
      return new Response(JSON.stringify({ 
        error: "Erro ao verificar usuário",
        success: false 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Generate recovery link
    console.log('🔗 Generating recovery link...');
    try {
      const { data, error } = await supabaseClient.auth.admin.generateLink({
        type: 'recovery',
        email: safeEmail,
        options: {
          redirectTo: finalRedirectTo
        }
      });

      if (error) {
        console.error('❌ Error generating recovery link:', error);
        return new Response(JSON.stringify({ 
          error: 'Erro ao gerar link de recuperação',
          success: false
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const resetLink = data.properties?.action_link;
      if (!resetLink) {
        console.error('❌ No action link in response');
        return new Response(JSON.stringify({ 
          error: 'Erro ao gerar link de recuperação',
          success: false
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      console.log(`✅ Recovery link generated for ${safeEmail}`);

      // Send email using Resend
      console.log(`📧 Sending reset email to: ${safeEmail}`);
      
      const emailResponse = await resend.emails.send({
        from: "Lovable <onboarding@resend.dev>",
        to: [safeEmail],
        subject: "Reset de Senha - Mentoria Futura",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e40af; margin: 0;">🔐 Reset de Senha</h1>
              <h2 style="color: #1e293b; margin: 10px 0;">Mentoria Futura</h2>
            </div>
            
            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #1e40af;">
              <h3 style="color: #1e40af; margin-top: 0;">Olá!</h3>
              <p style="color: #1e3a8a; line-height: 1.6; margin: 15px 0;">
                Você solicitou a redefinição da sua senha no sistema Mentoria Futura.
                Clique no botão abaixo para redefinir sua senha:
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="display: inline-block; background-color: #1e40af; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                🔑 Redefinir Senha
              </a>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #1e293b; margin-top: 0;">Ou copie e cole este link:</h4>
              <p style="word-break: break-all; color: #6b7280; background-color: #f9fafb; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
                ${resetLink}
              </p>
            </div>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-weight: 500;">
                ⚠️ <strong>Importante:</strong><br>
                • Este link expira em 1 hora<br>
                • Se você não solicitou esta redefinição, ignore este email<br>
                • Após redefinir, faça login com a nova senha
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <div style="text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Mentoria Futura - Sistema de Gestão de Aprendizagem<br>
                Este é um e-mail automático, por favor não responda diretamente.
              </p>
            </div>
          </div>
        `,
      });

      console.log("📧 Reset email sent successfully:", emailResponse);

      // Check for Resend errors
      if (emailResponse.error) {
        console.error("❌ Resend error:", emailResponse.error);
        return new Response(JSON.stringify({ 
          error: 'Erro ao enviar email',
          success: false
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ 
        message: 'Link de reset de senha enviado para seu email',
        success: true
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } catch (recoveryError: any) {
      console.error('❌ Recovery generation error:', recoveryError);
      return new Response(JSON.stringify({ 
        error: 'Erro ao gerar link de recuperação',
        success: false
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error('💥 Critical function error:', {
      message: error?.message,
      stack: error?.stack,
      type: typeof error,
      name: error?.name
    });
    
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      success: false 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);