import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  studentData: {
    nome: string;
    email: string;
    telefone?: string;
    empresa?: string;
    departamento?: string;
    cargo?: string;
    unidade?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Confirmation email function called");

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
    const { studentData }: ConfirmationEmailRequest = await req.json();
    console.log("Processing confirmation email for:", studentData.email);

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const emailResponse = await resend.emails.send({
      from: "Sistema Mentoria <noreply@mentoriafutura.com.br>",
      to: [studentData.email],
      subject: "Inscrição Realizada com Sucesso - Sistema de Mentoria",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Inscrição Realizada com Sucesso!</h2>
          
          <p>Olá, <strong>${studentData.nome}</strong>!</p>
          
          <p>Sua inscrição no <strong>Sistema de Mentoria</strong> foi realizada com sucesso e está aguardando aprovação da nossa equipe.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="margin-top: 0; color: #1e40af;">Próximos Passos:</h3>
            <ul style="margin: 10px 0;">
              <li>Nossa equipe revisará sua inscrição</li>
              <li>Você receberá um email de confirmação quando sua inscrição for aprovada</li>
              <li>Após a aprovação, você poderá acessar o sistema e se inscrever nos cursos disponíveis</li>
            </ul>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0;">Dados da sua inscrição:</h3>
            <p><strong>Nome:</strong> ${studentData.nome}</p>
            <p><strong>Email:</strong> ${studentData.email}</p>
            ${studentData.telefone ? `<p><strong>Telefone:</strong> ${studentData.telefone}</p>` : ''}
            ${studentData.empresa ? `<p><strong>Empresa:</strong> ${studentData.empresa}</p>` : ''}
            ${studentData.departamento ? `<p><strong>Departamento:</strong> ${studentData.departamento}</p>` : ''}
            ${studentData.cargo ? `<p><strong>Cargo:</strong> ${studentData.cargo}</p>` : ''}
            ${studentData.unidade ? `<p><strong>Unidade:</strong> ${studentData.unidade}</p>` : ''}
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0;"><strong>⏰ Tempo de Análise:</strong> Normalmente processamos as inscrições em até 24 horas úteis.</p>
          </div>
          
          <p>Se você tiver alguma dúvida, entre em contato conosco.</p>
          
          <p style="margin-top: 30px;">
            Atenciosamente,<br>
            <strong>Equipe Sistema de Mentoria</strong>
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            Este é um email automático, por favor não responda. Se precisar de ajuda, entre em contato através dos nossos canais oficiais.
          </p>
        </div>
      `,
    });

    console.log("Confirmation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Confirmation email sent successfully",
        emailResponse 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
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