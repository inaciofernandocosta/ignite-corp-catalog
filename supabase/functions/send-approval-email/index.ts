import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  enrollmentData: {
    enrollment_id: string;
    course_id: string;
    student_id: string;
    status: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { enrollmentData }: ApprovalEmailRequest = await req.json();

    console.log('Processando e-mail de aprovação para inscrição:', enrollmentData.enrollment_id);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Buscar dados do estudante na tabela inscricoes_mentoria
    const { data: studentData, error: studentError } = await supabaseClient
      .from("inscricoes_mentoria")
      .select("id, nome, email, telefone, empresa, departamento, cargo, unidade, token_validacao, ativo")
      .eq("id", enrollmentData.student_id)
      .single();

    if (studentError || !studentData) {
      console.error('Erro ao buscar dados do estudante:', studentError);
      throw new Error("Estudante não encontrado");
    }

    console.log('Dados do estudante encontrados:', studentData.email);

    // Buscar dados do curso
    const { data: courseData, error: courseError } = await supabaseClient
      .from("cursos")
      .select("titulo, descricao")
      .eq("id", enrollmentData.course_id)
      .single();

    if (courseError || !courseData) {
      console.error('Erro ao buscar dados do curso:', courseError);
      throw new Error("Curso não encontrado");
    }

    // Verificar se o usuário já existe no Supabase Auth
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.listUsers();
    const existingUser = authUser?.users?.find(user => user.email === studentData.email);
    
    console.log('Usuário existe no Auth:', !!existingUser);
    console.log('Status ativo na inscricao:', studentData.ativo);

    // Determinar o tipo de email baseado na existência do usuário no Auth
    const isNewUser = !existingUser;
    const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://fauoxtziffljgictcvhi.supabase.co";

    let emailHtml: string;
    let emailSubject: string;

    if (isNewUser) {
      // Usuário novo - precisa ativar conta
      let tokenValidacao = studentData.token_validacao;
      if (!tokenValidacao) {
        // Gerar token único apenas para usuários novos
        tokenValidacao = crypto.randomUUID().replace(/-/g, '') + Date.now().toString();
        
        // Atualizar usuário com o token
        const { error: updateError } = await supabaseClient
          .from('inscricoes_mentoria')
          .update({ token_validacao: tokenValidacao })
          .eq('id', enrollmentData.student_id);

        if (updateError) {
          console.error('Erro ao atualizar token:', updateError);
        }
      }

      const activationUrl = `${APP_BASE_URL}/auth?token=${tokenValidacao}&type=activation`;
      emailSubject = `🎉 Sua inscrição no curso "${courseData.titulo}" foi aprovada!`;
      
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">🎉 Parabéns!</h1>
            <h2 style="color: #1e293b; margin: 10px 0;">Sua inscrição foi aprovada!</h2>
          </div>
          
          <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #15803d; margin-top: 0;">Olá, ${studentData.nome}!</h3>
            <p style="color: #166534; line-height: 1.6; margin: 15px 0;">
              Temos o prazer de informar que sua inscrição no curso <strong>"${courseData.titulo}"</strong> foi aprovada! 
              Agora você precisa ativar sua conta para acessar nossa plataforma.
            </p>
          </div>

          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">📝 Seus dados cadastrais:</h3>
            <ul style="color: #475569; line-height: 1.8; padding-left: 20px;">
              <li><strong>Nome:</strong> ${studentData.nome}</li>
              <li><strong>E-mail:</strong> ${studentData.email}</li>
              ${studentData.telefone ? `<li><strong>Telefone:</strong> ${studentData.telefone}</li>` : ''}
              ${studentData.empresa ? `<li><strong>Empresa:</strong> ${studentData.empresa}</li>` : ''}
              ${studentData.departamento ? `<li><strong>Departamento:</strong> ${studentData.departamento}</li>` : ''}
              ${studentData.cargo ? `<li><strong>Cargo:</strong> ${studentData.cargo}</li>` : ''}
              ${studentData.unidade ? `<li><strong>Unidade:</strong> ${studentData.unidade}</li>` : ''}
            </ul>
          </div>

          <div style="background-color: #1e40af; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
            <h3 style="margin-top: 0; color: white;">🚀 Primeiro acesso: Ative sua conta</h3>
            <p style="margin: 15px 0; opacity: 0.9;">
              Como este é seu primeiro acesso, você precisa ativar sua conta e definir sua senha:
            </p>
            <a href="${activationUrl}" 
               style="display: inline-block; background-color: #16a34a; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 10px 0;">
              🔓 Ativar Minha Conta
            </a>
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-weight: 500;">
              ⚠️ <strong>Importante:</strong><br>
              • O link de ativação é válido por 48 horas<br>
              • Após ativar, você poderá definir sua senha de acesso<br>
              • Guarde bem suas credenciais para futuros acessos
            </p>
          </div>

          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="color: #1e40af; margin: 0; font-weight: 500;">
              📚 <strong>Passos para começar:</strong><br>
              1. Clique no botão "Ativar Minha Conta" acima<br>
              2. Defina sua senha de acesso<br>
              3. Faça login na plataforma<br>
              4. Explore os cursos disponíveis e comece!
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #64748b; font-size: 14px; margin-bottom: 10px;">
              Precisa de ajuda? Entre em contato conosco:
            </p>
            <p style="margin: 5px 0;">
              <a href="mailto:contato@mentoriafutura.com.br" style="color: #2563eb; text-decoration: none;">
                📧 contato@mentoriafutura.com.br
              </a>
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Mentoria Futura - Transformando carreiras através da educação<br>
              Este é um e-mail automático, por favor não responda diretamente.
            </p>
          </div>
        </div>
      `;
    } else {
      // Usuário existente - pode fazer login diretamente
      const loginUrl = `${APP_BASE_URL}/auth`;
      emailSubject = `✅ Nova inscrição aprovada no curso "${courseData.titulo}"!`;
      
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">✅ Inscrição Aprovada!</h1>
            <h2 style="color: #1e293b; margin: 10px 0;">Novo curso disponível!</h2>
          </div>
          
          <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #15803d; margin-top: 0;">Olá, ${studentData.nome}!</h3>
            <p style="color: #166534; line-height: 1.6; margin: 15px 0;">
              Sua nova inscrição no curso <strong>"${courseData.titulo}"</strong> foi aprovada! 
              Como você já possui uma conta ativa, pode acessar a plataforma imediatamente.
            </p>
          </div>

          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">📚 Curso aprovado:</h3>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 3px solid #3b82f6;">
              <h4 style="color: #1e40af; margin: 0 0 8px 0;">${courseData.titulo}</h4>
              <p style="color: #475569; margin: 0; line-height: 1.5;">${courseData.descricao || 'Descrição do curso em breve...'}</p>
            </div>
          </div>

          <div style="background-color: #16a34a; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
            <h3 style="margin-top: 0; color: white;">🎯 Acesse agora sua plataforma</h3>
            <p style="margin: 15px 0; opacity: 0.9;">
              Sua conta já está ativa! Faça login com suas credenciais habituais:
            </p>
            <a href="${loginUrl}" 
               style="display: inline-block; background-color: #1e40af; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; margin: 10px 0;">
              🚀 Fazer Login na Plataforma
            </a>
          </div>

          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="color: #1e40af; margin: 0; font-weight: 500;">
              💡 <strong>Lembrete:</strong><br>
              • Use seu e-mail: <strong>${studentData.email}</strong><br>
              • Use a mesma senha da sua conta existente<br>
              • O novo curso já estará disponível no seu painel<br>
              • Você pode começar imediatamente!
            </p>
          </div>

          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
            <p style="color: #166534; margin: 0; font-weight: 500;">
              🎉 <strong>Vantagens de ter uma conta ativa:</strong><br>
              • Acesso imediato a novos cursos<br>
              • Histórico de progresso preservado<br>
              • Certificados em um só lugar<br>
              • Experiência personalizada continuada
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #64748b; font-size: 14px; margin-bottom: 10px;">
              Precisa de ajuda? Entre em contato conosco:
            </p>
            <p style="margin: 5px 0;">
              <a href="mailto:contato@mentoriafutura.com.br" style="color: #2563eb; text-decoration: none;">
                📧 contato@mentoriafutura.com.br
              </a>
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Mentoria Futura - Transformando carreiras através da educação<br>
              Este é um e-mail automático, por favor não responda diretamente.
            </p>
          </div>
        </div>
      `;
    }

    console.log(`Enviando e-mail de aprovação (${isNewUser ? 'novo usuário' : 'usuário existente'}) para:`, studentData.email);

    // Send approval email
    const emailResponse = await resend.emails.send({
      from: "Mentoria Futura <contato@mentoriafutura.com.br>",
      to: [studentData.email],
      subject: emailSubject,
      html: emailHtml,
    });

    console.log("E-mail de aprovação enviado:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "E-mail de aprovação enviado com sucesso",
      emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Erro ao enviar e-mail de aprovação:", error);
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