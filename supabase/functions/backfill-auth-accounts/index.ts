import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Iniciando backfill de contas de autenticação...');

    // Executar a função backfill
    const { data: results, error: backfillError } = await supabase
      .rpc('backfill_auth_accounts');

    if (backfillError) {
      console.error('Erro no backfill:', backfillError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Erro ao executar backfill: ' + backfillError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Processar resultados
    const sucessos = results?.filter(r => r.resultado === 'Conta criada com sucesso') || [];
    const erros = results?.filter(r => r.resultado !== 'Conta criada com sucesso') || [];

    console.log(`Backfill concluído: ${sucessos.length} sucessos, ${erros.length} erros`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Backfill concluído com sucesso`,
      resultados: {
        total: results?.length || 0,
        sucessos: sucessos.length,
        erros: erros.length,
        detalhes: results || []
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro na função backfill-auth-accounts:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);