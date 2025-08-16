import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TermsOfUse = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userState="visitor" onLogin={handleLogin} />
      
      <main className="container mx-auto px-4 py-16 mt-16">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="mb-8 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </Button>

          <h1 className="text-4xl font-heading font-bold mb-8">Termos de Uso</h1>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar e utilizar a plataforma Mentoria Futura, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve utilizar nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Descrição dos Serviços</h2>
              <p className="text-muted-foreground leading-relaxed">
                A Mentoria Futura é uma plataforma de educação corporativa que oferece cursos, treinamentos e programas de desenvolvimento profissional, com foco em tecnologia, inteligência artificial e inovação.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Registro e Conta de Usuário</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Para utilizar nossos serviços, você deve:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fornecer informações precisas e atualizadas durante o registro</li>
                  <li>Manter a confidencialidade de suas credenciais de acesso</li>
                  <li>Notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta</li>
                  <li>Ser responsável por todas as atividades realizadas em sua conta</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Uso Permitido</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Você concorda em utilizar nossos serviços apenas para:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fins educacionais e de desenvolvimento profissional</li>
                  <li>Atividades legais e em conformidade com estes termos</li>
                  <li>Acesso pessoal, sendo vedado o compartilhamento de credenciais</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Propriedade Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Todo o conteúdo disponibilizado na plataforma, incluindo textos, vídeos, imagens, logotipos e materiais didáticos, é de propriedade da Mentoria Futura ou de seus licenciadores, sendo protegido por leis de direitos autorais.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Certificados e Conclusão</h2>
              <p className="text-muted-foreground leading-relaxed">
                Os certificados são emitidos mediante conclusão satisfatória dos cursos, conforme critérios estabelecidos pela Mentoria Futura. Os certificados têm validade e reconhecimento conforme especificado em cada programa.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Política de Reembolso</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para cursos pagos, aplicam-se as políticas de reembolso específicas de cada programa, respeitando o Código de Defesa do Consumidor e as regulamentações aplicáveis.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                A Mentoria Futura não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes do uso da plataforma, incluindo perda de dados, lucros ou oportunidades de negócio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Modificações dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após sua publicação na plataforma. O uso continuado dos serviços constituirá aceitação das modificações.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para dúvidas sobre estes Termos de Uso, entre em contato conosco através do email: contato@mentoriafutura.com.br
              </p>
            </section>

            <div className="bg-muted p-6 rounded-lg mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>Última atualização:</strong> Janeiro de 2025
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};