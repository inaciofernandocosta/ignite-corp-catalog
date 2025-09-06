import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('🚀 Simple Password Reset Function started');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { email, redirectTo } = await req.json();
    console.log(`📧 Processing reset for: ${email}`);
    
    if (!email) {
      return new Response(JSON.stringify({ 
        error: "Email é obrigatório",
        success: false 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get Resend API key
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error('❌ RESEND_API_KEY not found');
      return new Response(JSON.stringify({ 
        error: "Email service not configured",
        success: false 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('📧 Sending email...');
    const resend = new Resend(resendKey);
    const finalRedirectTo = redirectTo || 'https://preview--ignite-corp-catalog.lovable.app/#/alterar-senha';
    
    const emailResponse = await resend.emails.send({
      from: "Mentoria Futura <onboarding@resend.dev>",
      to: [email],
      subject: "Reset de Senha - Mentoria Futura",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Reset de Senha</h1>
          <p>Você solicitou um reset de senha para sua conta na Mentoria Futura.</p>
          <p>Para redefinir sua senha, clique no link abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${finalRedirectTo}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Redefinir Senha
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Na página de reset, você pode inserir seu email novamente para receber o link oficial.
          </p>
        </div>
      `,
    });

    console.log("✅ Email sent successfully:", emailResponse.id);
    
    return new Response(JSON.stringify({ 
      message: 'Link de reset de senha enviado para seu email',
      success: true
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('💥 Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno: ' + error.message,
      success: false 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});