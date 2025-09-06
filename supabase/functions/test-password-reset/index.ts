import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('🚀 TEST Function started');
  console.log(`📧 Method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('✅ OPTIONS request received');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  console.log('📨 Processing request...');
  
  try {
    console.log('🔧 Testing env variables...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    
    console.log('📊 Env check results:');
    console.log(`- SUPABASE_URL: ${supabaseUrl ? 'Available' : 'Missing'}`);
    console.log(`- SERVICE_ROLE_KEY: ${serviceKey ? 'Available' : 'Missing'}`);
    console.log(`- RESEND_API_KEY: ${resendKey ? 'Available' : 'Missing'}`);
    
    if (!supabaseUrl || !serviceKey || !resendKey) {
      return new Response(JSON.stringify({ 
        error: 'Missing environment variables',
        details: {
          supabaseUrl: !!supabaseUrl,
          serviceKey: !!serviceKey,
          resendKey: !!resendKey
        }
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('✅ All env variables available');
    return new Response(JSON.stringify({ 
      message: 'Test successful - all env variables found',
      success: true
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('💥 Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Test error: ' + error.message,
      success: false 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});