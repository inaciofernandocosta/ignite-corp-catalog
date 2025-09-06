import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { PasswordResetEmail } from './_templates/password-reset.tsx'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    const { email, redirectTo } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔍 Verificando usuário no sistema:', email)

    // Check if user exists and is approved
    const { data: userData, error: userError } = await supabase
      .from('inscricoes_mentoria')
      .select('nome_completo, status_aprovacao')
      .eq('email', email.toLowerCase())
      .eq('status_aprovacao', 'aprovado')
      .single()

    console.log('👤 Dados do usuário:', { userData, userError })

    if (userError || !userData) {
      console.log('❌ Usuário não encontrado ou não aprovado')
      // Return success to avoid email enumeration
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Se o email estiver cadastrado, você receberá as instruções.' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Usuário encontrado e aprovado:', userData.nome_completo)

    // Generate reset token
    const resetToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    console.log('🎫 Gerando token de reset:', resetToken)

    // Store reset token in database
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_email: email.toLowerCase(),
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false
      })

    if (tokenError) {
      console.error('❌ Erro ao salvar token:', tokenError)
      throw new Error('Erro interno do servidor')
    }

    // Create reset link
    const resetLink = `${redirectTo}?token=${resetToken}`

    console.log('🔗 Link de reset criado:', resetLink)

    // Render email template
    const emailHtml = await renderAsync(
      React.createElement(PasswordResetEmail, {
        resetLink,
        userName: userData.nome_completo.split(' ')[0], // First name
      })
    )

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Mentoria Futura <no-reply@mentoriafutura.com.br>',
      to: [email],
      subject: 'Redefinição de Senha - Mentoria Futura',
      html: emailHtml,
    })

    if (emailError) {
      console.error('❌ Erro ao enviar email:', emailError)
      throw new Error('Erro ao enviar email de recuperação')
    }

    console.log('📧 Email enviado com sucesso:', emailData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de recuperação enviado com sucesso!' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('💥 Erro no processo:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})