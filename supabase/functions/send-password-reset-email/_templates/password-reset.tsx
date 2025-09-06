import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Img,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface PasswordResetEmailProps {
  resetLink: string
  userName?: string
}

export const PasswordResetEmail = ({
  resetLink,
  userName = 'Usuário',
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Redefinição de senha - Mentoria Futura</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src="https://fauoxtziffljgictcvhi.supabase.co/storage/v1/object/public/logos/mentoria-futura-logo.png"
            width="150"
            height="auto"
            alt="Mentoria Futura"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>Redefinição de Senha</Heading>
        
        <Text style={text}>
          Olá {userName},
        </Text>
        
        <Text style={text}>
          Recebemos uma solicitação para redefinir a senha da sua conta na Mentoria Futura.
          Se você fez esta solicitação, clique no botão abaixo para criar uma nova senha:
        </Text>

        <Section style={buttonSection}>
          <Button href={resetLink} style={button}>
            Redefinir Minha Senha
          </Button>
        </Section>

        <Text style={textSmall}>
          <strong>Este link expira em 1 hora por questões de segurança.</strong>
        </Text>

        <Text style={text}>
          Se você não solicitou a redefinição de senha, pode ignorar este email com segurança.
          Sua senha não será alterada.
        </Text>

        <Section style={divider} />

        <Text style={footer}>
          <strong>Mentoria Futura</strong><br />
          Educação Corporativa<br />
          Este é um email automático, não responda a esta mensagem.
        </Text>

        <Text style={disclaimer}>
          Se você está tendo problemas para clicar no botão "Redefinir Minha Senha", 
          copie e cole a URL abaixo no seu navegador:<br />
          <a href={resetLink} style={link}>{resetLink}</a>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
  maxWidth: '100%',
}

const logoSection = {
  padding: '20px 0',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto',
}

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const textSmall = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '16px 0',
  textAlign: 'center' as const,
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#ff6b35',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  margin: '0 auto',
}

const divider = {
  borderTop: '1px solid #e6ebf1',
  margin: '32px 0',
}

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'center' as const,
}

const disclaimer = {
  color: '#888',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '32px 0 0',
  textAlign: 'center' as const,
}

const link = {
  color: '#ff6b35',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
}