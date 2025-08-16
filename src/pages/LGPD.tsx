import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const LGPD = () => {
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

          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-heading font-bold">Conformidade com a LGPD</h1>
          </div>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Lei Geral de Proteção de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                A Mentoria Futura está comprometida com a proteção dos dados pessoais de nossos usuários em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
              <div className="bg-primary/5 p-6 rounded-lg text-center">
                <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Proteção</h3>
                <p className="text-sm text-muted-foreground">Seus dados são protegidos com as melhores práticas de segurança</p>
              </div>
              <div className="bg-primary/5 p-6 rounded-lg text-center">
                <Eye className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Transparência</h3>
                <p className="text-sm text-muted-foreground">Você tem acesso completo às informações sobre seus dados</p>
              </div>
              <div className="bg-primary/5 p-6 rounded-lg text-center">
                <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Controle</h3>
                <p className="text-sm text-muted-foreground">Você decide como seus dados são utilizados</p>
              </div>
            </div>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Compromissos da LGPD</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Garantimos que:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Tratamos seus dados com finalidade específica e legítima</li>
                  <li>Coletamos apenas os dados necessários para nossos serviços</li>
                  <li>Mantemos seus dados atualizados e precisos</li>
                  <li>Armazenamos seus dados pelo tempo mínimo necessário</li>
                  <li>Implementamos medidas de segurança adequadas</li>
                  <li>Respeitamos sua privacidade e direitos fundamentais</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Seus Direitos Garantidos pela LGPD</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Direitos de Acesso</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Confirmação da existência de tratamento</li>
                    <li>• Acesso aos dados pessoais</li>
                    <li>• Correção de dados incompletos ou desatualizados</li>
                    <li>• Anonimização, bloqueio ou eliminação</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Direitos de Controle</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Portabilidade dos dados</li>
                    <li>• Eliminação dos dados tratados</li>
                    <li>• Informação sobre compartilhamento</li>
                    <li>• Revogação do consentimento</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Como Exercer Seus Direitos</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Para exercer qualquer um dos seus direitos garantidos pela LGPD, você pode:
              </p>
              <div className="bg-muted p-6 rounded-lg">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Email de Contato</h4>
                    <p className="text-sm text-muted-foreground">contato@mentoriafutura.com.br</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Tempo de Resposta</h4>
                    <p className="text-sm text-muted-foreground">Responderemos sua solicitação em até 15 dias úteis</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Documentação Necessária</h4>
                    <p className="text-sm text-muted-foreground">Documento de identificação para validar a solicitação</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Medidas de Segurança</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Implementamos as seguintes medidas de segurança:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Criptografia:</strong> Todos os dados são criptografados em trânsito e em repouso</li>
                  <li><strong>Controle de Acesso:</strong> Acesso restrito baseado no princípio da necessidade</li>
                  <li><strong>Monitoramento:</strong> Monitoramento contínuo de atividades suspeitas</li>
                  <li><strong>Backup Seguro:</strong> Backups regulares com criptografia</li>
                  <li><strong>Treinamento:</strong> Treinamento regular da equipe sobre proteção de dados</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Incidentes de Segurança</h2>
              <p className="text-muted-foreground leading-relaxed">
                Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, 
                notificaremos a Autoridade Nacional de Proteção de Dados (ANPD) e os titulares afetados 
                conforme estabelecido pela LGPD.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Encarregado de Dados (DPO)</h2>
              <div className="bg-primary/5 p-6 rounded-lg">
                <p className="text-muted-foreground mb-4">
                  Nosso Encarregado de Proteção de Dados está disponível para esclarecimentos sobre 
                  o tratamento de dados pessoais e para receber comunicações da ANPD.
                </p>
                <p className="font-medium">Contato: contato@mentoriafutura.com.br</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Autoridade Nacional de Proteção de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Você também pode apresentar reclamações relacionadas ao tratamento de seus dados pessoais 
                diretamente à Autoridade Nacional de Proteção de Dados (ANPD) através do canal oficial: 
                <a href="https://www.gov.br/anpd" className="text-primary hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                  www.gov.br/anpd
                </a>
              </p>
            </section>

            <div className="bg-muted p-6 rounded-lg mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>Última atualização:</strong> Janeiro de 2025
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Esta página está em conformidade com a Lei nº 13.709/2018 (LGPD)
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};