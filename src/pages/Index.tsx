import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeatureBanner } from "@/components/FeatureBanner";
import { FilterSection } from "@/components/FilterSection";
import { ImmersionCard } from "@/components/ImmersionCard";
import { HowItWorks } from "@/components/HowItWorks";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { type UserState, type AccessState } from "@/data/mockData";
import { useCourses } from "@/hooks/useCourses";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Filter {
  id: string;
  label: string;
  category: string;
}

const Index = () => {
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const { toast } = useToast();
  const { courses, loading, error } = useCourses();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Filter courses based on filters (simplified since filters were removed)
  const filteredImmersions = courses;

  // Determine user state based on authentication
  const getUserState = (): UserState => {
    if (!user || !profile) return 'visitor';
    
    // Check if user has corporate email
    const email = profile.email.toLowerCase();
    const corporateDomains = ['mentoriafutura.com.br', 'empresa.com', 'corp.com'];
    const hasCorporateEmail = corporateDomains.some(domain => email.includes(domain));
    
    if (hasCorporateEmail) return 'logged-corporate';
    
    // Check if user's company is in our database
    if (profile.empresa && profile.empresa !== '') {
      return 'logged-corporate';
    }
    
    return 'logged-personal';
  };

  const userState = getUserState();

  const handleLogin = () => {
    if (user && profile) {
      // Se já está logado, redirecionar para dashboard
      navigate('/dashboard');
    } else {
      // Se não está logado, ir para tela de auth
      navigate('/auth');
    }
  };

  const handleCorporateLogin = () => {
    navigate('/auth');
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
      
      <FeatureBanner />
      
      <FilterSection 
        onFiltersChange={setActiveFilters}
        resultCount={filteredImmersions.length}
      />
      
      <main className="py-16">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-heading font-semibold text-foreground mb-4">
                Carregando cursos...
              </h3>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <h3 className="text-2xl font-heading font-semibold text-foreground mb-4">
                Erro ao carregar cursos
              </h3>
              <p className="text-muted-foreground mb-8">
                {error}
              </p>
            </div>
          ) : filteredImmersions.length === 0 ? (
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