import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseDetails } from '@/hooks/useCourseDetails';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ApplicationForm } from '@/components/ApplicationForm';
import { CourseEnrollmentModal } from '@/components/CourseEnrollmentModal';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { 
  Clock, 
  Calendar, 
  MapPin, 
  Users, 
  Star, 
  BookOpen, 
  Award, 
  ArrowLeft,
  CheckCircle,
  Play,
  FileText,
  Globe,
  XCircle
} from 'lucide-react';
import { formatDateWithoutTimezone } from '@/lib/dateUtils';
import { supabase } from '@/integrations/supabase/client';

export const CourseDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { course, loading } = useCourseDetails(slug || '');
  const { user, profile } = useAuth();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [existingEnrollment, setExistingEnrollment] = useState<{status: string; data_inscricao: string} | null>(null);

  // Determine user state based on authentication (memoized)
  const userState = useMemo(() => {
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

  const handleSignOut = useCallback(() => {
    // This will be handled by the Header component
  }, []);

  const handleCTAClick = useCallback(() => {
    if (!user || !profile) {
      setShowApplicationForm(true);
      return;
    }
    
    // Para usuários logados, mostrar modal de confirmação de inscrição
    setShowEnrollmentModal(true);
  }, [user, profile]);

  const handleApplicationFormClose = useCallback(() => {
    setShowApplicationForm(false);
  }, []);

  // Verificar se usuário já está inscrito
  const checkExistingEnrollment = useCallback(async () => {
    if (!profile?.id || !course?.id) return;
    
    try {
      const { data } = await supabase
        .from('inscricoes_cursos')
        .select('status, data_inscricao')
        .eq('curso_id', course.id)
        .eq('aluno_id', profile.id)
        .maybeSingle();
        
      setExistingEnrollment(data);
    } catch (error) {
      setExistingEnrollment(null);
    }
  }, [profile?.id, course?.id]);

  const handleEnrollmentModalClose = useCallback(() => {
    setShowEnrollmentModal(false);
    // Verificar novamente após fechar o modal
    if (profile?.id && course?.id) {
      checkExistingEnrollment();
    }
  }, [profile?.id, course?.id, checkExistingEnrollment]);

  useEffect(() => {
    checkExistingEnrollment();
  }, [checkExistingEnrollment]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header userState={userState} onLogin={handleLogin} onSignOut={handleSignOut} />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando detalhes do curso...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen">
        <Header userState={userState} onLogin={handleLogin} onSignOut={handleSignOut} />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Curso não encontrado</h1>
            <p className="text-muted-foreground mb-6">O curso que você está procurando não existe ou foi removido.</p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const levelLabels = {
    'Básico': 'Introdutório',
    'Intermediário': 'Intermediário',
    'Avançado': 'Avançado'
  };

  const levelColors = {
    'Básico': 'success',
    'Intermediário': 'warning', 
    'Avançado': 'destructive'
  } as const;

  return (
    <div className="min-h-screen bg-background">
        <Header userState={userState} onLogin={handleLogin} onSignOut={handleSignOut} />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb e Botão Voltar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
              <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">
                Início
              </button>
              <span>/</span>
              <span>Cursos</span>
              <span>/</span>
              <span className="text-foreground truncate max-w-32 sm:max-w-none">{course.titulo}</span>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 w-full sm:w-auto text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Catálogo
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
            {/* Course Info */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                <Badge variant="outline" className="text-xs sm:text-sm font-medium">
                  Programa Presencial
                </Badge>
                <Badge variant="new" className="text-xs sm:text-sm">
                  Novo
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-heading font-bold text-foreground mb-4 sm:mb-6 leading-tight">
                {course.titulo}
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                {course.descricao}
              </p>

              {/* Quick Info */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duração</p>
                    <p className="font-semibold">{course.duracao}</p>
                  </div>
                </div>

                {course.data_inicio && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Início</p>
                      <p className="font-semibold">{formatDateWithoutTimezone(course.data_inicio)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nível</p>
                    <Badge variant={levelColors[course.nivel as keyof typeof levelColors] || 'secondary'} className="text-xs">
                      {levelLabels[course.nivel as keyof typeof levelLabels] || course.nivel}
                    </Badge>
                  </div>
                </div>

                {course.certificacao && (
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Certificado</p>
                      <p className="font-semibold text-success">Incluído</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Course Image & CTA */}
            <div className="lg:col-span-1 order-1 lg:order-2">
              <Card className="lg:sticky lg:top-8">
                {course.imagem_capa && (
                  <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-lg">
                    <img 
                      src={course.imagem_capa} 
                      alt={course.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <CardContent className="p-4 sm:p-6">
                  <div className="text-center mb-4 sm:mb-6">
                    {course.preco && course.preco > 0 ? (
                      <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                        R$ {course.preco.toFixed(2)}
                      </div>
                    ) : (
                      <div className="text-xl sm:text-2xl font-bold text-success mb-2">
                        Gratuito
                      </div>
                    )}
                    <p className="text-xs sm:text-sm text-muted-foreground">Investimento total</p>
                  </div>
                  
                  <Button 
                    size="lg" 
                     className={`w-full mb-3 sm:mb-4 font-semibold text-sm sm:text-base ${
                       existingEnrollment && existingEnrollment.status === 'pendente' ? 'bg-warning hover:bg-warning/90' :
                       existingEnrollment && existingEnrollment.status === 'aprovado' ? 'bg-success hover:bg-success/90' :
                       existingEnrollment && existingEnrollment.status === 'reprovado' ? 'bg-destructive hover:bg-destructive/90' :
                       existingEnrollment && existingEnrollment.status === 'concluido' ? 'bg-primary hover:bg-primary/90' : ''
                     }`}
                    onClick={handleCTAClick}
                    disabled={!!existingEnrollment}
                  >
                    {existingEnrollment ? 
                      (existingEnrollment.status === 'pendente' ? 'Aguardando aprovação' :
                       existingEnrollment.status === 'aprovado' ? 'Inscrito' :
                       existingEnrollment.status === 'reprovado' ? 'Inscrição negada' :
                       existingEnrollment.status === 'concluido' ? 'Concluído' : 'Inscrever-se') :
                      (user && profile ? 'Inscrever-se' : 'Quero me aplicar')
                    }
                  </Button>
                  
                  <div className="text-xs text-center text-muted-foreground">
                    {existingEnrollment ? (
                      <>
                        {existingEnrollment.status === 'pendente' && (
                          <>
                            <Clock className="w-4 h-4 inline mr-1 text-warning" />
                            <span className="text-warning">Aguardando aprovação da inscrição</span>
                          </>
                        )}
                        {existingEnrollment.status === 'aprovado' && (
                          <>
                            <CheckCircle className="w-4 h-4 inline mr-1 text-success" />
                            <span className="text-success">Você está inscrito no curso</span>
                          </>
                        )}
                         {existingEnrollment.status === 'reprovado' && (
                           <>
                             <XCircle className="w-4 h-4 inline mr-1 text-destructive" />
                             <span className="text-destructive">Inscrição não aprovada</span>
                           </>
                         )}
                         
                         {existingEnrollment.status === 'concluido' && (
                           <>
                             <Award className="w-4 h-4 inline mr-1 text-primary" />
                             <span className="text-primary">Curso concluído com sucesso</span>
                           </>
                         )}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Vagas limitadas - Inscreva-se já!
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Course Details */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
            <div className="lg:col-span-2 space-y-8 sm:space-y-12">
              {/* Objetivos */}
              {course.objetivos && course.objetivos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      O que você vai aprender
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {course.objetivos.map((objetivo, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                          <span>{objetivo}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Pré-requisitos */}
              {course.pre_requisitos && course.pre_requisitos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Pré-requisitos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {course.pre_requisitos.map((requisito, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <span>{requisito}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Descrição detalhada */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Sobre este curso
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {course.descricao}
                  </p>
                  
                  <Separator className="my-6" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Modalidade</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Presencial - Poços de Caldas
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Formato</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Turmas pequenas e interativas
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Certificação */}
                {course.certificacao && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Award className="w-5 h-5 text-primary" />
                        Certificação
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Ao concluir este curso, você receberá um certificado de conclusão reconhecido.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-success">
                        <CheckCircle className="w-4 h-4" />
                        Certificado incluído
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Informações adicionais */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detalhes do curso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Duração:</span>
                      <span className="text-sm font-medium">{course.duracao}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Nível:</span>
                      <Badge variant={levelColors[course.nivel as keyof typeof levelColors] || 'secondary'} className="text-xs">
                        {levelLabels[course.nivel as keyof typeof levelLabels] || course.nivel}
                      </Badge>
                    </div>
                    
                    {course.data_inicio && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Início:</span>
                        <span className="text-sm font-medium">{formatDateWithoutTimezone(course.data_inicio)}</span>
                      </div>
                    )}
                    
                    {course.data_fim && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Término:</span>
                        <span className="text-sm font-medium">{formatDateWithoutTimezone(course.data_fim)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Modalidade:</span>
                      <span className="text-sm font-medium">Presencial</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-4">
            Pronto para transformar sua carreira?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
            Junte-se aos profissionais que estão se preparando para o futuro do trabalho com IA.
          </p>
          <Button 
            size="lg" 
             className={`font-semibold px-6 sm:px-8 w-full sm:w-auto ${
               existingEnrollment && existingEnrollment.status === 'pendente' ? 'bg-warning hover:bg-warning/90' :
               existingEnrollment && existingEnrollment.status === 'aprovado' ? 'bg-success hover:bg-success/90' :
               existingEnrollment && existingEnrollment.status === 'reprovado' ? 'bg-destructive hover:bg-destructive/90' :
               existingEnrollment && existingEnrollment.status === 'concluido' ? 'bg-primary hover:bg-primary/90' : ''
             }`}
            onClick={handleCTAClick}
            disabled={!!existingEnrollment}
          >
            {existingEnrollment ? 
              (existingEnrollment.status === 'pendente' ? 'Aguardando aprovação' :
               existingEnrollment.status === 'aprovado' ? 'Inscrito' :
               existingEnrollment.status === 'reprovado' ? 'Inscrição negada' :
               existingEnrollment.status === 'concluido' ? 'Concluído' : 'Inscreva-se agora') :
              (user && profile ? 'Inscrever-se agora' : 'Quero me aplicar')
            }
          </Button>
        </div>
      </section>

      <Footer />

      {/* Application Form Modal */}
      {showApplicationForm && (
        <ApplicationForm 
          onClose={handleApplicationFormClose}
          course={course ? {
            id: course.id,
            titulo: course.titulo
          } : undefined}
        />
      )}

      {/* Course Enrollment Modal */}
      {showEnrollmentModal && course && user && profile && (
        <CourseEnrollmentModal
          isOpen={showEnrollmentModal}
          onClose={handleEnrollmentModalClose}
          course={{
            id: course.id,
            title: course.titulo,
            duration: course.duracao,
            startDate: course.data_inicio,
            slug: course.slug
          }}
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
};