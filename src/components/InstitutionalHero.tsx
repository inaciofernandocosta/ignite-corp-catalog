import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Zap, 
  Target, 
  Users, 
  Briefcase, 
  Sparkles, 
  TrendingUp,
  Building2,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { ApplicationForm } from "./ApplicationForm";
import { useState } from "react";

interface InstitutionalHeroProps {
  userState: 'visitor' | 'logged-corporate' | 'logged-personal' | 'logged-no-company';
  onCorporateLogin: () => void;
  onContractForCompany: () => void;
}

export function InstitutionalHero({ userState, onCorporateLogin, onContractForCompany }: InstitutionalHeroProps) {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  
  const features = [
    {
      icon: <Target className="w-5 h-5" />,
      title: "Metodologia Prática",
      description: "Aprendizado baseado em casos reais e aplicação imediata"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Especialistas da Indústria",
      description: "Professores com experiência em empresas líderes"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Resultados Comprovados",
      description: "Mais de 1000 profissionais transformados"
    }
  ];

  const getHeroContent = () => {
    switch (userState) {
      case 'visitor':
      case 'logged-personal':
      case 'logged-no-company':
        return {
          title: "Transforme seu Futuro com",
          highlight: "Educação Corporativa de Elite",
          subtitle: "Acelere sua carreira e a de sua equipe com metodologias inovadoras, cases reais e aplicação prática. Conecte-se com especialistas da indústria e empresas que mais crescem em tecnologia.",
          primaryCTA: "Quero me aplicar",
          secondaryCTA: "Contratar para empresa",
          primaryAction: () => setShowApplicationForm(true),
          secondaryAction: onContractForCompany,
          showBadge: true
        };
      
      case 'logged-corporate':
        return {
          title: "Bem-vindo ao seu",
          highlight: "Portal de Desenvolvimento",
          subtitle: "Acesse suas imersões exclusivas e acelere o crescimento da sua equipe com conteúdos personalizados para sua empresa.",
          primaryCTA: "Ver Meus Cursos",
          secondaryCTA: null,
          primaryAction: () => {}, // Navigate to courses
          secondaryAction: null,
          showBadge: false
        };
      
      default:
        return {
          title: "Inovação em",
          highlight: "Educação Corporativa",
          subtitle: "Capacitação avançada para profissionais e empresas que buscam excelência.",
          primaryCTA: null,
          secondaryCTA: null,
          primaryAction: null,
          secondaryAction: null,
          showBadge: false
        };
    }
  };

  const content = getHeroContent();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-left space-y-8">
            {content.showBadge && (
              <div className="animate-fade-in">
                <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-colors">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Programa de Excelência
                </Badge>
              </div>
            )}
            
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-bold leading-tight">
                <span className="text-foreground">{content.title}</span>
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {content.highlight}
                </span>
              </h1>
            </div>
            
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {content.subtitle}
            </p>
            
            {(content.primaryCTA || content.secondaryCTA) && (
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                {content.primaryCTA && (
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-4 bg-primary hover:bg-primary/90 font-semibold min-w-64 group hover-scale"
                    onClick={content.primaryAction}
                  >
                    {content.primaryCTA}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
                
                {content.secondaryCTA && (
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-lg px-8 py-4 font-semibold min-w-64 hover-scale"
                    onClick={content.secondaryAction}
                  >
                    <Building2 className="w-5 h-5 mr-2" />
                    {content.secondaryCTA}
                  </Button>
                )}
              </div>
            )}
            
            {/* Features */}
            <div className="grid sm:grid-cols-3 gap-6 pt-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3 group hover-scale">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Element */}
          <div className="hidden lg:flex justify-center animate-fade-in" style={{ animationDelay: '1s' }}>
            <div className="relative">
              {/* Main Card */}
              <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 shadow-2xl p-8 max-w-sm hover-scale">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">Mentoria Futura</h3>
                        <p className="text-sm text-muted-foreground">Educação Corporativa</p>
                      </div>
                    </div>
                    <Badge variant="new" className="animate-pulse">
                      Novo
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-foreground">Metodologia Comprovada</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-foreground">Cases Reais da Indústria</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-foreground">Aplicação Imediata</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">1000+</div>
                      <div className="text-xs text-muted-foreground">Profissionais</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent">95%</div>
                      <div className="text-xs text-muted-foreground">Satisfação</div>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary rounded-full animate-bounce" style={{ animationDelay: '2s' }} />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-accent rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
            </div>
          </div>
        </div>
      </div>
      
      {showApplicationForm && (
        <ApplicationForm onClose={() => setShowApplicationForm(false)} />
      )}
    </section>
  );
}