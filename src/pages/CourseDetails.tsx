import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourseDetails } from '@/hooks/useCourseDetails';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ApplicationForm } from '@/components/ApplicationForm';
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
  Globe
} from 'lucide-react';
import { formatDateWithoutTimezone } from '@/lib/dateUtils';

export const CourseDetails = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { course, loading } = useCourseDetails(slug || '');
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header userState="visitor" onLogin={() => {}} />
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
        <Header userState="visitor" onLogin={() => {}} />
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
      <Header userState="visitor" onLogin={() => {}} />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">
              Início
            </button>
            <span>/</span>
            <span>Cursos</span>
            <span>/</span>
            <span className="text-foreground">{course.titulo}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="flex gap-3 mb-6">
                <Badge variant="outline" className="text-sm font-medium">
                  Programa Presencial
                </Badge>
                <Badge variant="new" className="text-sm">
                  Novo
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-6">
                {course.titulo}
              </h1>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {course.descricao}
              </p>

              {/* Quick Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
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
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                {course.imagem_capa && (
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img 
                      src={course.imagem_capa} 
                      alt={course.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    {course.preco && course.preco > 0 ? (
                      <div className="text-3xl font-bold text-primary mb-2">
                        R$ {course.preco.toFixed(2)}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-success mb-2">
                        Gratuito
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">Investimento total</p>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="w-full mb-4 font-semibold"
                    onClick={() => setShowApplicationForm(true)}
                  >
                    Quero me aplicar
                  </Button>
                  
                  <div className="text-xs text-center text-muted-foreground">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Vagas limitadas - Inscreva-se já!
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Course Details */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
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
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">
            Pronto para transformar sua carreira?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se aos profissionais que estão se preparando para o futuro do trabalho com IA.
          </p>
          <Button 
            size="lg" 
            className="font-semibold px-8"
            onClick={() => setShowApplicationForm(true)}
          >
            Inscreva-se agora
          </Button>
        </div>
      </section>

      <Footer />

      {/* Application Form Modal */}
      {showApplicationForm && (
        <ApplicationForm onClose={() => setShowApplicationForm(false)} />
      )}
    </div>
  );
};