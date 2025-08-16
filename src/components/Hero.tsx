import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Building2, Users } from "lucide-react";
import { useStats } from "@/hooks/useStats";
import { ApplicationForm } from "./ApplicationForm";
import { useState } from "react";

interface HeroProps {
  userState: 'visitor' | 'logged-corporate' | 'logged-personal' | 'logged-no-company';
  onCorporateLogin: () => void;
  onContractForCompany: () => void;
}

export function Hero({ userState, onCorporateLogin, onContractForCompany }: HeroProps) {
  const { stats, activeBanner, loading } = useStats();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  
  const getHeroContent = () => {
    switch (userState) {
      case 'visitor':
      case 'logged-personal':
      case 'logged-no-company':
        return {
          title: activeBanner?.message || "Imersões em IA & Tecnologia",
          subtitle: "Aprenda diretamente com especialistas da indústria as práticas e estratégias das empresas que mais crescem em tecnologia.",
          primaryCTA: "Quero me aplicar",
          primaryAction: () => setShowApplicationForm(true),
          stats: loading 
            ? "Carregando estatísticas..." 
            : `+${stats.certificatesCount.toLocaleString('pt-BR')} colaboradores formados`
        };
      
      case 'logged-corporate':
        return {
          title: "Imersões em IA & Tecnologia",
          subtitle: "Escolha sua próxima imersão e acelere sua carreira com metodologia prática e aplicação imediata.",
          primaryCTA: null,
          primaryAction: null,
          stats: "Disponível através do seu convênio corporativo"
        };
      
      default:
        return {
          title: "Imersões em IA & Tecnologia",
          subtitle: "Acelere sua carreira com imersões práticas e especializadas.",
          primaryCTA: null,
          primaryAction: null,
          stats: ""
        };
    }
  };

  const content = getHeroContent();

  return (
    <section className="bg-gradient-hero py-20 lg:py-32">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-left">
            <h1 className="text-4xl lg:text-6xl font-heading font-bold text-foreground mb-6 leading-tight">
              {content.title}
            </h1>
            
            <p className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed max-w-lg">
              {content.subtitle}
            </p>
            
            {content.primaryCTA && (
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4 bg-primary hover:bg-primary-hover font-semibold min-w-64"
                  onClick={content.primaryAction}
                >
                  {content.primaryCTA}
                </Button>
              </div>
            )}
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="w-4 h-4 mr-2" />
              {content.stats}
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