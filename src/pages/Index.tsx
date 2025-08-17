import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Header } from "@/components/Header";
import { InstitutionalHero } from "@/components/InstitutionalHero";
import { FilterSection } from "@/components/FilterSection";
import { ImmersionCard } from "@/components/ImmersionCard";
import { HowItWorks } from "@/components/HowItWorks";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { ApplicationForm } from "@/components/ApplicationForm";
import { CourseEnrollmentModal } from "@/components/CourseEnrollmentModal";
import { Button } from "@/components/ui/button";
import { type UserState, type AccessState } from "@/data/mockData";
import { useCourses } from "@/hooks/useCourses";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Filter {
  id: string;
  label: string;
  category: string;
}

const Index = React.memo(() => {
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedCourseForApplication, setSelectedCourseForApplication] = useState<any>(null);
  const [existingEnrollment, setExistingEnrollment] = useState<{status: string; data_inscricao: string} | null>(null);
  const [userEnrollments, setUserEnrollments] = useState<Record<string, {status: string; data_inscricao: string}>>({});
  const { toast } = useToast();
  const { courses, loading, error } = useCourses();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Filter courses based on filters (simplified since filters were removed)
  const filteredImmersions = courses;

  // Determine user state based on authentication (memoized)
  const userState = useMemo((): UserState => {
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
  }, [user, profile]);

  const handleLogin = useCallback(() => {
    if (user && profile) {
      // Se já está logado, redirecionar para dashboard
      navigate('/dashboard');
    } else {
      // Se não está logado, ir para tela de auth
      navigate('/auth');
    }
  }, [user, profile, navigate]);


  const handleCorporateLogin = useCallback(() => {
    navigate('/auth');
  }, [navigate]);

  const handleContractForCompany = useCallback(() => {
    toast({
      title: "Interesse registrado", 
      description: "Nossa equipe entrará em contato em breve!",
    });
  }, [toast]);

  const handleCTAClick = useCallback((course: any) => {
    console.log('handleCTAClick called with:', {
      course: course,
      slug: course?.slug,
      id: course?.id,
      user: !!user,
      profile: !!profile,
      enrollmentStatus: userEnrollments[course?.id]
    });

    // Se o usuário já está inscrito, não fazer nada
    if (userEnrollments[course?.id]) {
      console.log('User already enrolled, not opening modal');
      return;
    }

    if (!user || !profile) {
      console.log('User not logged in, showing form');
      setSelectedCourseForApplication(course);
      setShowApplicationForm(true);
      return;
    }
    
    // Para usuários logados, mostrar modal de confirmação de inscrição
    console.log('User logged in, showing enrollment modal');
    setSelectedCourse(course);
    setShowEnrollmentModal(true);
  }, [user, profile, userEnrollments]);

  const handleApplicationFormClose = useCallback(() => {
    setShowApplicationForm(false);
    setSelectedCourseForApplication(null);
  }, []);

  // Verificar todas as inscrições do usuário
  const loadUserEnrollments = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      const { data } = await supabase
        .from('inscricoes_cursos')
        .select('curso_id, status, data_inscricao')
        .eq('aluno_id', profile.id);
        
      if (data) {
        const enrollmentsMap = data.reduce((acc, enrollment) => {
          acc[enrollment.curso_id] = {
            status: enrollment.status,
            data_inscricao: enrollment.data_inscricao
          };
          return acc;
        }, {} as Record<string, {status: string; data_inscricao: string}>);
        
        setUserEnrollments(enrollmentsMap);
      }
    } catch (error) {
      console.error('Error loading user enrollments:', error);
    }
  }, [profile?.id]);

  const handleEnrollmentModalClose = useCallback(() => {
    setShowEnrollmentModal(false);
    setSelectedCourse(null);
    setExistingEnrollment(null);
    // Recarregar inscrições do usuário após fechar modal
    if (profile?.id) {
      loadUserEnrollments();
    }
  }, [profile?.id, loadUserEnrollments]);

  // Carregar inscrições do usuário quando ele estiver logado
  useEffect(() => {
    if (profile?.id) {
      loadUserEnrollments();
    } else {
      setUserEnrollments({});
    }
  }, [profile?.id, loadUserEnrollments]);

  // Verificar se usuário já está inscrito no curso selecionado
  const checkExistingEnrollment = useCallback(async (courseId: string) => {
    if (!profile?.id || !courseId) return;
    
    try {
      const { data } = await supabase
        .from('inscricoes_cursos')
        .select('status, data_inscricao')
        .eq('curso_id', courseId)
        .eq('aluno_id', profile.id)
        .maybeSingle();
        
      setExistingEnrollment(data);
    } catch (error) {
      setExistingEnrollment(null);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (selectedCourse?.id) {
      checkExistingEnrollment(selectedCourse.id);
    }
  }, [selectedCourse?.id, checkExistingEnrollment]);

  // Get access state for each course (memoized)
  const getAccessState = useCallback((course: any): AccessState => {
    if (!user || !profile) return 'locked';
    
    // For now, return 'available' for all authenticated users
    // This can be extended with more complex logic later
    return 'available';
  }, [user, profile]);

  const handleClearFilters = useCallback(() => {
    setActiveFilters([]);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        userState={userState} 
        onLogin={handleLogin}
      />
      
      <InstitutionalHero 
        userState={userState} 
        onCorporateLogin={handleCorporateLogin}
        onContractForCompany={handleContractForCompany}
      />
      
      <FilterSection 
        onFiltersChange={setActiveFilters}
        resultCount={filteredImmersions.length}
      />
      
      <main className="py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12 sm:py-16 lg:py-20">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-heading font-semibold text-foreground mb-4">
                Carregando cursos...
              </h3>
            </div>
          ) : error ? (
            <div className="text-center py-12 sm:py-16 lg:py-20">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-heading font-semibold text-foreground mb-4">
                Erro ao carregar cursos
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto">
                {error}
              </p>
            </div>
          ) : filteredImmersions.length === 0 ? (
            <div className="text-center py-12 sm:py-16 lg:py-20">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-heading font-semibold text-foreground mb-4">
                Nenhuma imersão encontrada
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto">
                Tente ajustar os filtros ou entre em contato com nosso suporte.
              </p>
              <Button 
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleClearFilters}
              >
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {filteredImmersions.map((immersion) => (
                <ImmersionCard
                  key={immersion.id}
                  immersion={immersion}
                  userState={userState}
                  accessState={getAccessState(immersion)}
                  enrollmentStatus={userEnrollments[immersion.id]}
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
      
      {showApplicationForm && (
        <ApplicationForm 
          onClose={handleApplicationFormClose}
          course={selectedCourseForApplication}
        />
      )}
      
      {showEnrollmentModal && selectedCourse && user && profile && (
        <CourseEnrollmentModal
          isOpen={showEnrollmentModal}
          onClose={handleEnrollmentModalClose}
          course={selectedCourse}
          user={{
            id: profile.id,
            email: profile.email,
            name: profile.nome
          }}
          existingEnrollment={existingEnrollment}
        />
      )}
    </div>
  );
});

export default Index;