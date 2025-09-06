import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('🚀 Password Reset V2 Function started');
  console.log(`📧 Method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('✅ OPTIONS request received');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    console.log('❌ Method not allowed:', req.method);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  console.log('📨 Processing POST request...');
  
  try {
    // Parse request
    const requestData = await req.json();
    const { email, redirectTo } = requestData;
    
    console.log(`📧 Email received: ${email}`);
    console.log(`🔗 Redirect URL: ${redirectTo}`);
    
    if (!email) {
      return new Response(JSON.stringify({ error: "Email é obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send notification email directly (no user verification to avoid database issues)
    console.log('📧 Sending reset notification for email:', email);
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const finalRedirectTo = redirectTo || 'https://preview--ignite-corp-catalog.lovable.app/#/alterar-senha';
    
    try {
      const emailResponse = await resend.emails.send({
        from: "Mentoria Futura <onboarding@resend.dev>",
        to: [email],
        subject: "Reset de Senha - Mentoria Futura",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Reset de Senha Solicitado</h1>
            <p>Você solicitou um reset de senha para sua conta na Mentoria Futura.</p>
            <p>Para redefinir sua senha, clique no link abaixo:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${finalRedirectTo}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Ir para Reset de Senha
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Na página de reset, você poderá inserir seu email novamente para receber o link oficial do Supabase.
            </p>
            <p style="color: #666; font-size: 14px;">
              Se você não solicitou este reset, pode ignorar este email.
            </p>
            <p style="color: #666; font-size: 14px;">
              Link direto: <a href="${finalRedirectTo}">${finalRedirectTo}</a>
            </p>
          </div>
        `,
      });

      console.log("✅ V2 Notification email sent successfully:", emailResponse);
      
      return new Response(JSON.stringify({ 
        message: 'Link de reset de senha enviado para seu email (v2)',
        success: true
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
      
    } catch (emailError: any) {
      console.error('❌ Error sending email:', emailError);
      return new Response(JSON.stringify({ 
        error: 'Error sending email: ' + emailError.message,
        success: false
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

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