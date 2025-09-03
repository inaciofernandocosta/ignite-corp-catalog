import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Target, Users, Clock, CheckCircle, ArrowRight, BookOpen, Video, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const IaNaPratica = () => {
  const handleLogin = () => {
    // Função vazia por enquanto
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Header userState="visitor" onLogin={handleLogin} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-2">
              🚀 Programa Exclusivo
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-6">
              IA na Prática
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Domine as ferramentas de Inteligência Artificial e transforme sua produtividade no trabalho. 
              Um programa prático e hands-on para profissionais que querem sair na frente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/index">
                <Button size="lg" className="w-full sm:w-auto">
                  <Brain className="mr-2 h-5 w-5" />
                  Quero me Inscrever
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <Video className="mr-2 h-5 w-5" />
                Ver Demonstração
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">5 horas</div>
                <p className="text-muted-foreground">de conteúdo prático</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">15+</div>
                <p className="text-muted-foreground">ferramentas de IA</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <p className="text-muted-foreground">hands-on</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">Certificado</div>
                <p className="text-muted-foreground">de conclusão</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* O que você vai aprender */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">O que você vai aprender</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Conteúdo prático e aplicável no seu dia a dia profissional
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Brain className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">ChatGPT & Claude</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Domine prompts avançados e técnicas de conversação para máxima produtividade.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Automação de Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Crie relatórios, apresentações e documentos profissionais em minutos.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Target className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">IA para Análise de Dados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Transforme dados em insights valiosos usando ferramentas de IA.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Video className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Criação de Conteúdo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Gere imagens, vídeos e textos profissionais com qualidade excepcional.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">IA no Atendimento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Implemente chatbots e automatize processos de atendimento ao cliente.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Estratégias Avançadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Aprenda a integrar IA na sua rotina e processos de trabalho.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Para quem é */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl mb-4">Para quem é este programa?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p>Profissionais que querem aumentar sua produtividade</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p>Gestores e líderes em busca de inovação</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p>Empreendedores que desejam otimizar processos</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p>Profissionais de marketing e vendas</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p>Analistas e consultores</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <p>Qualquer pessoa curiosa sobre IA</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Final */}
        <section className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-8">
              <h3 className="text-2xl font-bold mb-4">
                Pronto para transformar sua carreira com IA?
              </h3>
              <p className="text-muted-foreground mb-6">
                Junte-se aos profissionais que já estão usando IA para ter resultados excepcionais.
              </p>
              <Link to="/index">
                <Button size="lg" className="w-full sm:w-auto">
                  Inscrever-se Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};