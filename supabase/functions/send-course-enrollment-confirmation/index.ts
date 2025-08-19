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

interface EnrollmentConfirmationRequest {
  enrollmentData: {
    enrollment_id: string;
    course_id: string;
    student_id: string;
    enrollment_date: string;
  };
}

// Security functions
function getRealIP(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
         request.headers.get("x-real-ip") || 
         "unknown";
}

function isRateLimited(key: string, maxAttempts: number = 15): boolean {
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
  
  const { enrollment_id, course_id, student_id, enrollment_date } = enrollmentData;
  
  if (!enrollment_id || typeof enrollment_id !== 'string' || 
      !course_id || typeof course_id !== 'string' ||
      !student_id || typeof student_id !== 'string' ||
      !enrollment_date || typeof enrollment_date !== 'string') {
    return { valid: false, error: 'Missing or invalid required fields' };
  }
  
  // Validate UUIDs format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(enrollment_id) || !uuidRegex.test(course_id) || !uuidRegex.test(student_id)) {
    return { valid: false, error: 'Invalid UUID format' };
  }
  
  // Validate date format (basic ISO check)
  if (isNaN(Date.parse(enrollment_date))) {
    return { valid: false, error: 'Invalid date format' };
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
  if (isRateLimited(clientIP, 15)) {
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

    const { enrollmentData }: EnrollmentConfirmationRequest = requestData;

    console.log('Processing enrollment confirmation:', enrollmentData.enrollment_id);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Fetch student data with parameterized query
    const { data: student, error: studentError } = await supabaseClient
      .from("inscricoes_mentoria")
      .select("nome, email, empresa, departamento")
      .eq("id", enrollmentData.student_id)
      .single();

    if (studentError || !student) {
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
    if (!emailRegex.test(student.email)) {
      console.error('Invalid email format:', student.email);
      return new Response(JSON.stringify({ 
        error: "Invalid email format",
        success: false 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch course data
    const { data: course, error: courseError } = await supabaseClient
      .from("cursos")
      .select("titulo, descricao, data_inicio, duracao")
      .eq("id", enrollmentData.course_id)
      .single();

    if (courseError || !course) {
      console.error('Error fetching course data:', courseError);
      return new Response(JSON.stringify({ 
        error: "Course not found",
        success: false 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Format date safely
    let courseStartDate = 'A definir';
    try {
      if (course.data_inicio) {
        courseStartDate = new Date(course.data_inicio).toLocaleDateString('pt-BR');
      }
    } catch (e) {
      console.warn('Error formatting date:', e);
    }

    console.log('Sending email to:', student.email);

    // Sanitize all user inputs
    const safeName = sanitizeString(student.nome);
    const safeCourseTitle = sanitizeString(course.titulo);
    const safeDuration = sanitizeString(course.duracao || '');
    const safeEmail = student.email; // Already validated with regex

    // Send enrollment confirmation email to student with proper error handling
    try {
      const emailResponse = await resend.emails.send({
        from: "Mentoria Futura <contato@mentoriafutura.com.br>",
        to: [safeEmail],
        subject: `Inscrição recebida: ${safeCourseTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; text-align: center;">Inscrição Recebida!</h1>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1e293b; margin-top: 0;">Olá, ${safeName}!</h2>
              <p style="color: #475569; line-height: 1.6;">
                Recebemos sua inscrição para o curso <strong>${safeCourseTitle}</strong> e ela está sendo analisada pela nossa equipe.
              </p>
              <p style="color: #475569; line-height: 1.6;">
                Em breve você receberá um retorno sobre a aprovação da sua inscrição.
              </p>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin-top: 0;">Detalhes do Curso:</h3>
              <ul style="color: #475569; line-height: 1.8; padding-left: 20px;">
                <li><strong>Curso:</strong> ${safeCourseTitle}</li>
                <li><strong>Duração:</strong> ${safeDuration}</li>
                <li><strong>Data de Início:</strong> ${courseStartDate}</li>
                <li><strong>Local:</strong> Poços de Caldas - MG</li>
              </ul>
            </div>

            <div style="background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <p style="color: #1e40af; margin: 0; font-weight: 500;">
                📧 Aguarde o e-mail de confirmação da aprovação. Nossa equipe analisará sua inscrição e retornará em breve.
              </p>
            </div>

            <div style="background-color: #fff7ed; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-weight: 500;">
                ⏰ <strong>Próximos passos:</strong><br>
                1. Nossa equipe analisará sua inscrição<br>
                2. Você receberá um e-mail com o resultado<br>
                3. Se aprovado, receberá detalhes sobre cronograma e materiais
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

      console.log("Enrollment confirmation email sent:", emailResponse);

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Enrollment confirmation email sent successfully",
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
    console.error("Error processing enrollment confirmation:", error);
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