import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FilterSection } from "@/components/FilterSection";
import { ImmersionCard } from "@/components/ImmersionCard";
import { HowItWorks } from "@/components/HowItWorks";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { mockImmersions, type UserState, type AccessState } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

interface Filter {
  id: string;
  label: string;
  category: string;
}

const Index = () => {
  const [userState, setUserState] = useState<UserState>('visitor');
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const { toast } = useToast();

  // Filter immersions based on filters only  
  const filteredImmersions = mockImmersions.filter(immersion => {
    // Category filters
    const matchesFilters = activeFilters.length === 0 || activeFilters.every(filter => {
      switch (filter.category) {
        case 'tema':
          return immersion.tags.some(tag => 
            tag.toLowerCase().includes(filter.id.replace('-', ' '))
          );
        case 'nivel':
          const levelMap = { 'intro': 'intro', 'intermediario': 'intermediate', 'avancado': 'advanced' };
          return immersion.level === levelMap[filter.id as keyof typeof levelMap];
        case 'carga':
          const days = immersion.workloadDays;
          switch (filter.id) {
            case '1-dia': return days === 1;
            case '2-dias': return days === 2;
            case '3-dias': return days >= 3;
            default: return true;
          }
        default:
          return true;
      }
    });

    return matchesFilters;
  });

  const handleLogin = () => {
    // Simulate different login states for demonstration
    const states: UserState[] = ['logged-corporate', 'logged-personal', 'logged-no-company'];
    const randomState = states[Math.floor(Math.random() * states.length)];
    setUserState(randomState);
    
    toast({
      title: "Login realizado",
      description: `Estado: ${randomState}`,
    });
  };

  const handleCorporateLogin = () => {
    setUserState('logged-corporate');
    toast({
      title: "Login corporativo",
      description: "Acesso liberado com e-mail corporativo",
    });
  };

  const handleContractForCompany = () => {
    toast({
      title: "Interesse registrado", 
      description: "Nossa equipe entrará em contato em breve!",
    });
  };

  const handleCTAClick = (immersionId: string, action: string) => {
    toast({
      title: "Ação registrada",
      description: `${action} - ${immersionId}`,
    });
  };

  const getAccessState = (immersionId: string): AccessState => {
    if (userState !== 'logged-corporate') return 'locked';
    
    // Simulate some immersions not being in the plan
    const restrictedIds = ['deep-learning-avancado', 'mlops-production'];
    return restrictedIds.includes(immersionId) ? 'not-in-plan' : 'available';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        userState={userState}
        onLogin={handleLogin}
      />
      
      <Hero 
        userState={userState}
        onCorporateLogin={handleCorporateLogin}
        onContractForCompany={handleContractForCompany}
      />
      
      <FilterSection 
        onFiltersChange={setActiveFilters}
        resultCount={filteredImmersions.length}
      />
      
      <main className="py-16">
        <div className="container mx-auto px-6">
          {filteredImmersions.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-heading font-semibold text-foreground mb-4">
                Nenhuma imersão encontrada
              </h3>
              <p className="text-muted-foreground mb-8">
                Tente ajustar os filtros ou entre em contato com nosso suporte.
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  setActiveFilters([]);
                }}
              >
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredImmersions.map((immersion) => (
                <ImmersionCard
                  key={immersion.id}
                  immersion={immersion}
                  userState={userState}
                  accessState={getAccessState(immersion.id)}
                  onCTAClick={handleCTAClick}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <HowItWorks onContractClick={handleContractForCompany} />
      
      <FAQ />
      
      <Footer />
    </div>
  );
};

export default Index;