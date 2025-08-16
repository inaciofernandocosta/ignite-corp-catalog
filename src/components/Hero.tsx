import { Button } from "@/components/ui/button";
import { AlertCircle, Building2 } from "lucide-react";

interface HeroProps {
  userState: 'visitor' | 'logged-corporate' | 'logged-personal' | 'logged-no-company';
  onCorporateLogin: () => void;
  onContractForCompany: () => void;
}

export function Hero({ userState, onCorporateLogin, onContractForCompany }: HeroProps) {
  const getHeroContent = () => {
    switch (userState) {
      case 'visitor':
        return {
          title: "Imersões em IA & Tecnologia",
          subtitle: "Acesse com seu e-mail corporativo para ver o catálogo completo.",
          primaryCTA: "Entrar com e-mail corporativo",
          primaryAction: onCorporateLogin,
          secondaryCTA: "Sou decisor e quero contratar",
          secondaryAction: onContractForCompany,
          showAlert: false
        };
      
      case 'logged-personal':
        return {
          title: "Imersões em IA & Tecnologia",
          subtitle: "Use seu e-mail corporativo para acessar o catálogo completo.",
          primaryCTA: "Entrar com e-mail corporativo",
          primaryAction: onCorporateLogin,
          secondaryCTA: "Contratar para minha empresa",
          secondaryAction: onContractForCompany,
          showAlert: true,
          alertMessage: "Use seu e-mail corporativo para acessar as imersões"
        };
      
      case 'logged-no-company':
        return {
          title: "Imersões em IA & Tecnologia",
          subtitle: "Sua empresa ainda não tem acesso. Solicite a contratação para liberar o catálogo.",
          primaryCTA: "Contratar para minha empresa",
          primaryAction: onContractForCompany,
          secondaryCTA: null,
          secondaryAction: null,
          showAlert: false
        };
      
      case 'logged-corporate':
        return {
          title: "Imersões em IA & Tecnologia",
          subtitle: "Escolha sua próxima imersão e acelere sua carreira em tecnologia.",
          primaryCTA: null,
          primaryAction: null,
          secondaryCTA: null,
          secondaryAction: null,
          showAlert: false
        };
      
      default:
        return {
          title: "Imersões em IA & Tecnologia",
          subtitle: "Acelere sua carreira com imersões práticas e especializadas.",
          primaryCTA: null,
          primaryAction: null,
          secondaryCTA: null,
          secondaryAction: null,
          showAlert: false
        };
    }
  };

  const content = getHeroContent();

  return (
    <section className="bg-gradient-hero py-16">
      <div className="container mx-auto px-4 text-center">
        {content.showAlert && (
          <div className="mb-6 inline-flex items-center space-x-2 bg-warning-light text-warning-foreground px-4 py-2 rounded-lg border border-warning/20">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{content.alertMessage}</span>
          </div>
        )}
        
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
          {content.title}
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {content.subtitle}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {content.primaryCTA && (
            <Button 
              size="lg" 
              className="min-w-48"
              onClick={content.primaryAction}
            >
              <Building2 className="w-5 h-5 mr-2" />
              {content.primaryCTA}
            </Button>
          )}
          
          {content.secondaryCTA && (
            <Button 
              variant="outline" 
              size="lg"
              className="min-w-48"
              onClick={content.secondaryAction}
            >
              {content.secondaryCTA}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}