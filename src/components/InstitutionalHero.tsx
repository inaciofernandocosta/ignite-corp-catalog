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
      title: "Especialistas do Varejo",
      description: "Instrutores com experiência em práticas"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Resultados Comprovados",
      description: "Mais de 20 profissionais mentorados"
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
          subtitle: "Acelere sua carreira e a de sua equipe com metodologias inovadoras, cases reais e aplicação prática. Conecte-se com especialistas do varejo e empresas que mais crescem em tecnologia.",
          primaryCTA: null,
          secondaryCTA: null,
          primaryAction: null,
          secondaryAction: null,
          showBadge: true
        };
      
      case 'logged-corporate':
        return {
          title: "Bem-vindo ao seu",
          highlight: "Portal de Desenvolvimento",
          subtitle: "Acesse suas imersões exclusivas e acelere o crescimento da sua equipe com conteúdos personalizados para sua empresa.",
          primaryCTA: null,
          secondaryCTA: null,
          primaryAction: null,
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
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 lg:py-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Content */}
          <div className="text-center space-y-4 sm:space-y-6">
            {content.showBadge && (
              <div className="animate-fade-in">
                <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 transition-colors text-xs sm:text-sm">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Programa de Excelência
                </Badge>
              </div>
            )}
            
            <div className="space-y-3 sm:space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-heading font-bold leading-tight max-w-5xl mx-auto px-4">
                <span className="text-foreground">{content.title}</span>
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {content.highlight}
                </span>
              </h1>
            </div>
            
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto animate-fade-in px-4" style={{ animationDelay: '0.4s' }}>
              {content.subtitle}
            </p>
            
            {(content.primaryCTA || content.secondaryCTA) && (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center animate-fade-in px-4" style={{ animationDelay: '0.6s' }}>
                {content.primaryCTA && (
                  <Button 
                    size="lg" 
                    className="text-base sm:text-lg px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-primary hover:bg-primary/90 font-semibold w-full sm:w-auto sm:min-w-64 group hover-scale"
                    onClick={content.primaryAction}
                  >
                    {content.primaryCTA}
                    <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
                
                {content.secondaryCTA && (
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-base sm:text-lg px-6 sm:px-8 lg:px-10 py-3 sm:py-4 font-semibold w-full sm:w-auto sm:min-w-64 hover-scale"
                    onClick={content.secondaryAction}
                  >
                    <Building2 className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                    {content.secondaryCTA}
                  </Button>
                )}
              </div>
            )}
            
            {/* Features Grid - Horizontal Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-6 max-w-4xl mx-auto animate-fade-in px-4" style={{ animationDelay: '0.8s' }}>
              {features.map((feature, index) => (
                <div key={index} className="flex flex-col items-center space-y-2 sm:space-y-3 group hover-scale">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                    {feature.icon}
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1">{feature.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Row */}
            <div className="flex justify-center items-center gap-6 sm:gap-8 pt-4 animate-fade-in px-4" style={{ animationDelay: '1s' }}>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">20+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Profissionais Transformados</div>
              </div>
              <div className="w-px h-8 sm:h-10 bg-border"></div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-accent">100%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Taxa de Satisfação</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showApplicationForm && (
        <ApplicationForm 
          onClose={() => setShowApplicationForm(false)}
          course={{
            id: "01994310-7306-4bec-9ee9-16d51140dbca",
            title: "IA na Prática"
          }}
        />
      )}
    </section>
  );
}