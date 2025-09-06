import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncRequest {
  emails?: string[];
  action: 'sync' | 'diagnose' | 'sync_all_approved';
}

interface SyncResult {
  email: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  details?: any;
}

serve(async (req) => {
  console.log('🚀 Admin Sync Auth Users Function started');
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization header required" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if user is admin
    const { data: adminCheck } = await supabaseAdmin
      .from('inscricoes_mentoria')
      .select(`
        id,
        user_roles!inner(role, active)
      `)
      .eq('email', user.email)
      .eq('user_roles.role', 'admin')
      .eq('user_roles.active', true)
      .single();

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const requestData: SyncRequest = await req.json();
    const { emails, action } = requestData;

    console.log(`📋 Action: ${action}, Emails: ${emails?.length || 0}`);

    let targetEmails: string[] = [];

    if (action === 'sync_all_approved') {
      // Get all approved users without auth accounts
      const { data: approvedUsers, error } = await supabaseAdmin
        .from('inscricoes_mentoria')
        .select('email')
        .eq('status', 'aprovado')
        .eq('ativo', true);

      if (error) {
        throw new Error(`Error fetching approved users: ${error.message}`);
      }

      targetEmails = approvedUsers?.map(u => u.email) || [];
    } else if (emails && emails.length > 0) {
      targetEmails = emails;
    } else {
      throw new Error("No emails provided and action is not sync_all_approved");
    }

    const results: SyncResult[] = [];

    if (action === 'diagnose') {
      // Diagnose inconsistencies
      for (const email of targetEmails) {
        try {
          const [
            { data: inscricaoUser },
            { data: authUser },
            { data: identities }
          ] = await Promise.all([
            supabaseAdmin
              .from('inscricoes_mentoria')
              .select('*')
              .eq('email', email)
              .single(),
            supabaseAdmin.auth.admin.listUsers().then(res => ({
              data: res.data.users.find(u => u.email === email)
            })),
            supabaseAdmin.auth.admin.listUsers().then(res => ({
              data: res.data.users.find(u => u.email === email)?.identities || []
            }))
          ]);

          const issues = [];
          
          if (!inscricaoUser) {
            issues.push("No inscricao_mentoria record");
          } else if (inscricaoUser.status !== 'aprovado' || !inscricaoUser.ativo) {
            issues.push("Not approved/active in inscricao_mentoria");
          }
          
          if (!authUser) {
            issues.push("No auth.users record");
          }
          
          if (authUser && identities.length === 0) {
            issues.push("No auth.identities records");
          }

          results.push({
            email,
            status: issues.length > 0 ? 'error' : 'success',
            message: issues.length > 0 ? issues.join(', ') : 'All consistent',
            details: {
              hasInscricao: !!inscricaoUser,
              hasAuth: !!authUser,
              hasIdentities: identities.length > 0,
              inscricaoStatus: inscricaoUser?.status,
              inscricaoAtivo: inscricaoUser?.ativo
            }
          });

        } catch (error) {
          results.push({
            email,
            status: 'error',
            message: `Diagnosis error: ${error.message}`,
          });
        }
      }
    } else {
      // Sync users
      for (const email of targetEmails) {
        try {
          // Check if user exists in inscricoes_mentoria and is approved
          const { data: inscricaoUser, error: inscricaoError } = await supabaseAdmin
            .from('inscricoes_mentoria')
            .select('*')
            .eq('email', email)
            .eq('status', 'aprovado')
            .eq('ativo', true)
            .single();

          if (inscricaoError || !inscricaoUser) {
            results.push({
              email,
              status: 'skipped',
              message: 'User not found or not approved/active in inscricoes_mentoria'
            });
            continue;
          }

          // Check if user already exists in auth.users
          const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = existingUsers.users.find(u => u.email === email);

          if (existingUser) {
            // User exists, check if identities are correct
            if (!existingUser.identities || existingUser.identities.length === 0) {
              results.push({
                email,
                status: 'error',
                message: 'User exists but has no identities - manual fix required'
              });
            } else {
              results.push({
                email,
                status: 'skipped',
                message: 'User already exists with correct identities'
              });
            }
            continue;
          }

          // Create new user using Admin API
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true,
            user_metadata: {
              nome: inscricaoUser.nome,
              email: email
            }
          });

          if (createError) {
            throw new Error(`Failed to create user: ${createError.message}`);
          }

          console.log(`✅ Created user ${email} with ID: ${newUser.user.id}`);

          results.push({
            email,
            status: 'success',
            message: 'User created successfully',
            details: {
              userId: newUser.user.id,
              nome: inscricaoUser.nome
            }
          });

        } catch (error) {
          console.error(`❌ Error syncing ${email}:`, error);
          results.push({
            email,
            status: 'error',
            message: `Sync error: ${error.message}`,
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      processedCount: targetEmails.length,
      results,
      summary: {
        success: results.filter(r => r.status === 'success').length,
        error: results.filter(r => r.status === 'error').length,
        skipped: results.filter(r => r.status === 'skipped').length
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error('💥 Error in admin-sync-auth-users:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal error: ' + error.message,
      success: false 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});