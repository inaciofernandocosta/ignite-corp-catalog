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

    // Check if user exists
    console.log('👤 Checking if user exists...');
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      throw new Error('Error checking user existence');
    }

    const userExists = authUsers?.users?.some(user => user.email === email);
    console.log(`👤 User exists: ${userExists}`);

    if (!userExists) {
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
      throw new Error('Error generating recovery link: ' + error.message);
    }

    const resetLink = data.properties?.action_link;
    if (!resetLink) {
      console.error('❌ No action link in response');
      throw new Error('No recovery link generated');
    }

    console.log('✅ Recovery link generated successfully');

    // Send email using Resend
    console.log('📧 Sending email via Resend...');
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const emailResponse = await resend.emails.send({
      from: "Lovable <onboarding@resend.dev>",
      to: [email],
      subject: "Reset de Senha - Mentoria Futura",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1e40af;">🔐 Reset de Senha</h1>
          <p>Você solicitou a redefinição da sua senha.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Redefinir Senha
            </a>
          </div>
          <p><strong>Este link expira em 1 hora.</strong></p>
          <hr>
          <p style="color: #666; font-size: 12px;">Mentoria Futura</p>
        </div>
      `,
    });

    console.log('📧 Email response:', emailResponse);

    if (emailResponse.error) {
      console.error('❌ Resend error:', emailResponse.error);
      throw new Error('Failed to send email: ' + emailResponse.error.message);
    }

    console.log('✅ Email sent successfully');
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