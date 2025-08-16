import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy = () => {
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

          <h1 className="text-4xl font-heading font-bold mb-8">Política de Privacidade</h1>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Informações Gerais</h2>
              <p className="text-muted-foreground leading-relaxed">
                A Mentoria Futura valoriza a privacidade e a proteção dos dados pessoais de seus usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Dados Coletados</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Coletamos os seguintes tipos de dados:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de Identificação:</strong> Nome completo, email, telefone</li>
                  <li><strong>Dados Profissionais:</strong> Empresa, departamento, cargo, local de trabalho</li>
                  <li><strong>Dados de Acesso:</strong> Endereço IP, informações do dispositivo, cookies</li>
                  <li><strong>Dados de Uso:</strong> Progresso nos cursos, certificados obtidos, tempo de acesso</li>
                  <li><strong>Dados de Pagamento:</strong> Informações de cobrança (quando aplicável)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Finalidades do Tratamento</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Utilizamos seus dados pessoais para:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fornecer acesso aos nossos serviços educacionais</li>
                  <li>Processar inscrições e emitir certificados</li>
                  <li>Melhorar a experiência do usuário na plataforma</li>
                  <li>Enviar comunicações sobre cursos e atualizações</li>
                  <li>Realizar análises estatísticas e de desempenho</li>
                  <li>Cumprir obrigações legais e regulamentares</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Base Legal para o Tratamento</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>O tratamento de seus dados pessoais está fundamentado em:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Consentimento:</strong> Para envio de comunicações de marketing</li>
                  <li><strong>Execução de Contrato:</strong> Para prestação dos serviços educacionais</li>
                  <li><strong>Legítimo Interesse:</strong> Para melhoria dos serviços e segurança</li>
                  <li><strong>Cumprimento de Obrigação Legal:</strong> Para questões fiscais e regulamentares</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Compartilhamento de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros, exceto quando necessário para prestação dos serviços, cumprimento de obrigações legais ou mediante seu consentimento expresso.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Armazenamento e Segurança</h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Os dados são armazenados em servidores seguros e criptografados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Retenção de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta política, respeitando os prazos legais de retenção e seus direitos como titular dos dados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Seus Direitos</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Como titular dos dados, você tem direito a:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Acessar seus dados pessoais</li>
                  <li>Corrigir dados incompletos ou desatualizados</li>
                  <li>Solicitar a exclusão de dados desnecessários</li>
                  <li>Revogar o consentimento a qualquer momento</li>
                  <li>Portar seus dados para outro fornecedor</li>
                  <li>Opor-se ao tratamento em certas circunstâncias</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies e tecnologias similares para melhorar a funcionalidade da plataforma, personalizar conteúdo e analisar o uso dos serviços. Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Alterações na Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Esta Política de Privacidade pode ser atualizada periodicamente. Notificaremos sobre alterações significativas através da plataforma ou por email.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, entre em contato conosco através do email: contato@mentoriafutura.com.br
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