import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ResetPasswordEmailProps {
  nome: string;
  resetLink: string;
}

export const ResetPasswordEmail = ({
  nome,
  resetLink,
}: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Redefinição de Senha - Mentoria Futura</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>Redefinição de Senha</Heading>
        </Section>
        
        <Section style={content}>
          <Text style={text}>Olá {nome || 'usuário'},</Text>
          
          <Text style={text}>
            Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma 
            nova senha:
          </Text>
          
          <Section style={buttonContainer}>
            <Button href={resetLink} style={button}>
              Redefinir Senha
            </Button>
          </Section>
          
          <Text style={smallText}>
            Este link é válido por 24 horas. Se você não solicitou esta redefinição, 
            ignore este email.
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            Atenciosamente,<br />
            Equipe IA na Prática
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ResetPasswordEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 24px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e6ebf1',
}

const h1 = {
  color: '#7c3aed',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
}

const content = {
  padding: '32px 24px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#7c3aed',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  minWidth: '200px',
}

const smallText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '16px 0',
  textAlign: 'center' as const,
}

const footer = {
  padding: '24px',
  borderTop: '1px solid #e6ebf1',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}