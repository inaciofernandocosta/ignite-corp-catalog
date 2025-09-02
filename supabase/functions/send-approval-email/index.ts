import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting store (simple in-memory for demo)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface ApprovalEmailRequest {
  enrollmentData: {
    enrollment_id: string;
    course_id: string;
    student_id: string;
    status: string;
  };
}

// Security functions
function getRealIP(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
         request.headers.get("x-real-ip") || 
         "unknown";
}

function isRateLimited(key: string, maxAttempts: number = 10): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  
  const current = rateLimitStore.get(key);
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }
  
  if (current.count >= maxAttempts) {
    return true;
  }
  
  current.count++;
  return false;
}

function validateInput(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const { enrollmentData } = data;
  if (!enrollmentData || typeof enrollmentData !== 'object') {
    return { valid: false, error: 'Invalid enrollment data' };
  }
  
  const { enrollment_id, course_id, student_id, status } = enrollmentData;
  
  if (!enrollment_id || typeof enrollment_id !== 'string' || 
      !course_id || typeof course_id !== 'string' ||
      !student_id || typeof student_id !== 'string' ||
      !status || typeof status !== 'string') {
    return { valid: false, error: 'Missing or invalid required fields' };
  }
  
  // Validate UUIDs format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(enrollment_id) || !uuidRegex.test(course_id) || !uuidRegex.test(student_id)) {
    return { valid: false, error: 'Invalid UUID format' };
  }
  
  // Validate status
  if (!['aprovado', 'reprovado', 'pendente'].includes(status)) {
    return { valid: false, error: 'Invalid status value' };
  }
  
  return { valid: true };
}

function sanitizeString(str: string, maxLength: number = 200): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>"\';]/g, '').substring(0, maxLength).trim();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const clientIP = getRealIP(req);

  // Rate limiting
  if (isRateLimited(clientIP, 20)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    // Parse and validate input
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const validation = validateInput(requestData);
    if (!validation.valid) {
      console.warn(`Input validation failed: ${validation.error} from IP: ${clientIP}`);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { enrollmentData }: ApprovalEmailRequest = requestData;

    console.log('Processing approval email for enrollment:', enrollmentData.enrollment_id);

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Fetch student data with parameterized query
    const { data: studentData, error: studentError } = await supabaseClient
      .from("inscricoes_mentoria")
      .select("id, nome, email, telefone, empresa, departamento, cargo, unidade, token_validacao, ativo")
      .eq("id", enrollmentData.student_id)
      .single();

    if (studentError || !studentData) {
      console.error('Error fetching student data:', studentError);
      return new Response(JSON.stringify({ 
        error: "Student not found",
        success: false 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(studentData.email)) {
      console.error('Invalid email format:', studentData.email);
      return new Response(JSON.stringify({ 
        error: "Invalid email format",
        success: false 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Student data found:', studentData.email);

    // Fetch course data
    const { data: courseData, error: courseError } = await supabaseClient
      .from("cursos")
      .select("titulo, descricao")
      .eq("id", enrollmentData.course_id)
      .single();

    if (courseError || !courseData) {
      console.error('Error fetching course data:', courseError);
      return new Response(JSON.stringify({ 
        error: "Course not found",
        success: false 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if user exists in Supabase Auth (secure)
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.listUsers();
    const existingUser = authUser?.users?.find(user => user.email === studentData.email);
    
    console.log('User exists in Auth:', !!existingUser);
    console.log('Active status in enrollment:', studentData.ativo);

    // Determine email type based on user existence in Auth
    const isNewUser = !existingUser;
    const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://preview--ignite-corp-catalog.lovable.app";

    // Sanitize all user inputs
    const safeName = sanitizeString(studentData.nome);
    const safeCourseTitle = sanitizeString(courseData.titulo);
    const safeCourseDescription = sanitizeString(courseData.descricao || '', 500);
    const safeEmail = studentData.email; // Already validated with regex
    const safePhone = sanitizeString(studentData.telefone || '');
    const safeCompany = sanitizeString(studentData.empresa || '');
    const safeDepartment = sanitizeString(studentData.departamento || '');
    const safePosition = sanitizeString(studentData.cargo || '');
    const safeUnit = sanitizeString(studentData.unidade || '');

    let emailHtml: string;
    let emailSubject: string;

    if (isNewUser) {
      // New user - needs to activate account
      let tokenValidacao = studentData.token_validacao;
      if (!tokenValidacao) {
        // Generate unique token for new users only
        tokenValidacao = crypto.randomUUID().replace(/-/g, '') + Date.now().toString();
        
        // Update user with token
        const { error: updateError } = await supabaseClient
          .from('inscricoes_mentoria')
          .update({ token_validacao: tokenValidacao })
          .eq('id', enrollmentData.student_id);

        if (updateError) {
          console.error('Error updating token:', updateError);
        }
      }

      const activationUrl = `${APP_BASE_URL}/auth?token=${encodeURIComponent(tokenValidacao)}&type=activation`;
      emailSubject = `🎉 Sua inscrição no curso "${safeCourseTitle}" foi aprovada!`;
      
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">🎉 Parabéns!</h1>
            <h2 style="color: #1e293b; margin: 10px 0;">Sua inscrição foi aprovada!</h2>
          </div>
          
          <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #15803d; margin-top: 0;">Olá, ${safeName}!</h3>
            <p style="color: #166534; line-height: 1.6; margin: 15px 0;">
              Temos o prazer de informar que sua inscrição no curso <strong>"${safeCourseTitle}"</strong> foi aprovada! 
              Agora você precisa ativar sua conta para acessar nossa plataforma.
            </p>
          </div>

          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">📝 Seus dados cadastrais:</h3>
            <ul style="color: #475569; line-height: 1.8; padding-left: 20px;">
              <li><strong>Nome:</strong> ${safeName}</li>
              <li><strong>E-mail:</strong> ${safeEmail}</li>
              ${safePhone ? `<li><strong>Telefone:</strong> ${safePhone}</li>` : ''}
              ${safeCompany ? `<li><strong>Empresa:</strong> ${safeCompany}</li>` : ''}
              ${safeDepartment ? `<li><strong>Departamento:</strong> ${safeDepartment}</li>` : ''}
              ${safePosition ? `<li><strong>Cargo:</strong> ${safePosition}</li>` : ''}
              ${safeUnit ? `<li><strong>Unidade:</strong> ${safeUnit}</li>` : ''}
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
      emailSubject = `✅ Nova inscrição aprovada no curso "${safeCourseTitle}"!`;
      
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">✅ Inscrição Aprovada!</h1>
            <h2 style="color: #1e293b; margin: 10px 0;">Novo curso disponível!</h2>
          </div>
          
          <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #16a34a;">
            <h3 style="color: #15803d; margin-top: 0;">Olá, ${safeName}!</h3>
            <p style="color: #166534; line-height: 1.6; margin: 15px 0;">
              Sua nova inscrição no curso <strong>"${safeCourseTitle}"</strong> foi aprovada! 
              Como você já possui uma conta ativa, pode acessar a plataforma imediatamente.
            </p>
          </div>

          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">📚 Curso aprovado:</h3>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 3px solid #3b82f6;">
              <h4 style="color: #1e40af; margin: 0 0 8px 0;">${safeCourseTitle}</h4>
              <p style="color: #475569; margin: 0; line-height: 1.5;">${safeCourseDescription || 'Descrição do curso em breve...'}</p>
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

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-weight: 500;">
              💡 <strong>Dica:</strong><br>
              • Use as mesmas credenciais que você já possui<br>
              • Se esqueceu a senha, use a opção "Esqueci minha senha" na tela de login<br>
              • Após o login, você verá o novo curso disponível no seu painel
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

    console.log(`Sending approval email (${isNewUser ? 'new user' : 'existing user'}) to:`, safeEmail);

    // Send approval email with proper error handling
    try {
      const emailResponse = await resend.emails.send({
        from: "Mentoria Futura <contato@mentoriafutura.com.br>",
        to: [safeEmail],
        subject: emailSubject,
        html: emailHtml,
      });

      console.log("Approval email sent:", emailResponse);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Approval email sent successfully",
        emailResponse 
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });

    } catch (emailError) {
      console.error("Failed to send email via Resend:", emailError);
      return new Response(JSON.stringify({ 
        error: "Failed to send email",
        success: false 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("Error processing approval email:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
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
