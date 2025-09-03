import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationRequest {
  studentData: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    empresa?: string;
    departamento?: string;
    cargo?: string;
    unidade?: string;
    created_at: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Admin notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { studentData }: AdminNotificationRequest = await req.json();
    console.log("Processing admin notification for student:", studentData.email);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get admin emails
    const { data: admins, error: adminsError } = await supabase
      .from("user_roles")
      .select(`
        inscricoes_mentoria!inner(email, nome)
      `)
      .eq("role", "admin")
      .eq("active", true);

    if (adminsError) {
      console.error("Error fetching admins:", adminsError);
      throw new Error("Failed to fetch admin users");
    }

    if (!admins || admins.length === 0) {
      console.log("No admin users found");
      return new Response(
        JSON.stringify({ message: "No admin users to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Send notification to each admin
    const adminEmails = admins.map(admin => admin.inscricoes_mentoria.email);
    console.log("Sending notification to admins:", adminEmails);

    const emailResponse = await resend.emails.send({
      from: "Sistema Mentoria <noreply@mentoriafutura.com.br>",
      to: adminEmails,
      subject: "Nova Inscrição - Sistema de Mentoria",
      html: `
        <h2>Nova Inscrição Recebida</h2>
        <p>Uma nova inscrição foi recebida no sistema:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Dados do Candidato:</h3>
          <p><strong>Nome:</strong> ${studentData.nome}</p>
          <p><strong>Email:</strong> ${studentData.email}</p>
          ${studentData.telefone ? `<p><strong>Telefone:</strong> ${studentData.telefone}</p>` : ''}
          ${studentData.empresa ? `<p><strong>Empresa:</strong> ${studentData.empresa}</p>` : ''}
          ${studentData.departamento ? `<p><strong>Departamento:</strong> ${studentData.departamento}</p>` : ''}
          ${studentData.cargo ? `<p><strong>Cargo:</strong> ${studentData.cargo}</p>` : ''}
          ${studentData.unidade ? `<p><strong>Unidade:</strong> ${studentData.unidade}</p>` : ''}
          <p><strong>Data da Inscrição:</strong> ${new Date(studentData.created_at).toLocaleString('pt-BR')}</p>
        </div>
        
        <p>Acesse o painel administrativo para revisar e aprovar a inscrição.</p>
        
        <p>Atenciosamente,<br>Sistema de Mentoria</p>
      `,
    });

    console.log("Admin notification email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin notification sent successfully",
        emailResponse 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-admin-notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);