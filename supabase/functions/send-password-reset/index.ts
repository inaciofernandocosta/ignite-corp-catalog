import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

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

    // Check if user exists
    console.log('👤 Checking if user exists...');
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return new Response(JSON.stringify({ 
        error: 'Error checking user: ' + listError.message,
        success: false
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userExists = authUsers?.users?.some(user => user.email === email);
    console.log(`👤 User exists: ${userExists}`);

    if (!userExists) {
      console.log('⚠️ User not found, but returning success for security');
      return new Response(JSON.stringify({ 
        message: 'Link de reset de senha enviado para seu email (user not found)',
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

    // For now, just return the link without sending email
    console.log('✅ Returning success response with link');
    return new Response(JSON.stringify({ 
      message: 'Link de reset gerado com sucesso (não enviado por email ainda)',
      success: true,
      resetLink: resetLink  // For testing only
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