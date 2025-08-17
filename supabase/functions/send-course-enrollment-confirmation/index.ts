import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EnrollmentConfirmationRequest {
  enrollmentData: {
    enrollment_id: string;
    course_id: string;
    student_id: string;
    enrollment_date: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { enrollmentData }: EnrollmentConfirmationRequest = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Fetch student data
    const { data: student, error: studentError } = await supabaseClient
      .from("inscricoes_mentoria")
      .select("nome, email, empresa, departamento")
      .eq("id", enrollmentData.student_id)
      .single();

    if (studentError || !student) {
      throw new Error("Estudante não encontrado");
    }

    // Fetch course data
    const { data: course, error: courseError } = await supabaseClient
      .from("cursos")
      .select("titulo, descricao, data_inicio, duracao")
      .eq("id", enrollmentData.course_id)
      .single();

    if (courseError || !course) {
      throw new Error("Curso não encontrado");
    }

    // Format date
    const courseStartDate = course.data_inicio 
      ? new Date(course.data_inicio).toLocaleDateString('pt-BR')
      : 'A definir';

    // Send confirmation email to student
    const emailResponse = await resend.emails.send({
      from: "Mentoria Futura <contato@mentoriafutura.com.br>",
      to: [student.email],
      subject: `Inscrição confirmada: ${course.titulo}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center;">Inscrição Confirmada!</h1>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1e293b; margin-top: 0;">Olá, ${student.nome}!</h2>
            <p style="color: #475569; line-height: 1.6;">
              Sua inscrição no curso <strong>${course.titulo}</strong> foi confirmada com sucesso!
            </p>
          </div>

          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Detalhes do Curso:</h3>
            <ul style="color: #475569; line-height: 1.8; padding-left: 20px;">
              <li><strong>Curso:</strong> ${course.titulo}</li>
              <li><strong>Duração:</strong> ${course.duracao}</li>
              <li><strong>Data de Início:</strong> ${courseStartDate}</li>
              <li><strong>Local:</strong> Poços de Caldas - MG</li>
            </ul>
          </div>

          <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
            <p style="color: #1e40af; margin: 0; font-weight: 500;">
              📧 Em breve você receberá mais informações sobre o cronograma detalhado e materiais do curso.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #64748b; font-size: 14px;">
              Tem alguma dúvida? Entre em contato conosco:<br>
              <a href="mailto:contato@mentoriafutura.com.br" style="color: #2563eb;">contato@mentoriafutura.com.br</a>
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Mentoria Futura - Transformando carreiras através da educação<br>
              Este é um e-mail automático, por favor não responda.
            </p>
          </div>
        </div>
      `,
    });

    console.log("E-mail de confirmação enviado:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "E-mail de confirmação enviado com sucesso",
      emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Erro ao enviar e-mail de confirmação:", error);
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