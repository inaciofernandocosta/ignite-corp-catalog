import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('🚀 Function started');
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

    // Initialize Supabase client
    console.log('🔧 Initializing Supabase client...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log('✅ Supabase client initialized');

    // Check if user exists using RPC function
    console.log('👤 Checking if user exists...');
    const { data: emailExists, error: emailCheckError } = await supabase
      .rpc('email_exists_for_recovery', { email_to_check: email });
    
    console.log('📊 Email check result:', { emailExists, emailCheckError });
    
    if (emailCheckError) {
      console.error('❌ Error checking email:', emailCheckError);
      return new Response(JSON.stringify({ 
        error: 'Error checking user: ' + emailCheckError.message,
        success: false
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!emailExists) {
      console.log('⚠️ User not found, but returning success for security');
      return new Response(JSON.stringify({ 
        message: 'Link de reset de senha enviado para seu email',
        success: true
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Generate recovery link
    console.log('🔗 Generating recovery link...');
    const finalRedirectTo = redirectTo || 'https://preview--ignite-corp-catalog.lovable.app/#/alterar-senha';
    
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: finalRedirectTo
      }
    });

    if (error) {
      console.error('❌ Error generating recovery link:', error);
      return new Response(JSON.stringify({ 
        error: 'Error generating link: ' + error.message,
        success: false
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resetLink = data.properties?.action_link;
    if (!resetLink) {
      console.error('❌ No action link in response');
      return new Response(JSON.stringify({ 
        error: 'No recovery link generated',
        success: false
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('✅ Recovery link generated successfully');

    // Send email via Resend
    console.log('📧 Sending reset email...');
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    try {
      const emailResponse = await resend.emails.send({
        from: "Mentoria Futura <onboarding@resend.dev>",
        to: [email],
        subject: "Reset de Senha - Mentoria Futura",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; text-align: center;">Reset de Senha</h1>
            <p>Você solicitou um reset de senha para sua conta na Mentoria Futura.</p>
            <p>Clique no link abaixo para redefinir sua senha:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Redefinir Senha
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Este link é válido por 1 hora. Se você não solicitou este reset, pode ignorar este email.
            </p>
            <p style="color: #666; font-size: 14px;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br>
              <a href="${resetLink}">${resetLink}</a>
            </p>
          </div>
        `,
      });

      console.log("✅ Email sent successfully:", emailResponse);
      
      return new Response(JSON.stringify({ 
        message: 'Link de reset de senha enviado para seu email',
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