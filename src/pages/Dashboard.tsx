import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  GraduationCap, 
  Award, 
  FileText, 
  Clock, 
  Calendar,
  PlayCircle,
  CheckCircle,
  Download,
  Users,
  Settings,
  LogOut,
  Building,
  MapPin,
  Mail,
  UserCheck,
  Home,
  Briefcase,
  BookOpen
} from "lucide-react";
import { formatDateWithoutTimezone } from "@/lib/dateUtils";
import { StorageCertificateViewer } from '@/components/StorageCertificateViewer';
import { StudentManagement } from '@/components/admin/StudentManagement';
import { EditCourseDialog } from '@/components/admin/EditCourseDialog';
import { CourseStudentsDialog } from '@/components/admin/CourseStudentsDialog';
import { CreateCourseDialog } from '@/components/admin/CreateCourseDialog';
import { CreateModuleDialog } from '@/components/admin/CreateModuleDialog';
import { EditModuleDialog } from '@/components/admin/EditModuleDialog';
import { ManageModuleMaterialsDialog } from '@/components/admin/ManageModuleMaterialsDialog';
import { ViewModulesDialog } from '@/components/admin/ViewModulesDialog';
import { EnrollmentManagement } from '@/components/admin/EnrollmentManagement';
import { UserProfile } from '@/components/UserProfile';
import { CourseModulesViewer } from '@/components/student/CourseModulesViewer';

interface CourseEnrollment {
  id: string;
  curso_id: string;
  progresso: number;
  status: string;
  data_inscricao: string;
  ultima_atividade: string;
  curso: {
    titulo: string;
    descricao: string;
    duracao: string;
    nivel: string;
    imagem_capa: string;
  } | null;
}

interface Certificate {
  id: string;
  numero_certificado: string;
  data_emissao: string;
  data_conclusao: string;
  status: string;
  certificado_pdf: string | null;
  inscricao_curso_id: string;
  aprovado_por?: string;
  observacoes?: string;
  aluno_nome?: string;
}

interface CourseMaterial {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  formato: string;
  url: string;
  arquivo_nome: string;
  arquivo_tamanho: number;
  ordem: number;
  modulo_id?: string;
}

interface CourseModule {
  id: string;
  titulo: string;
  descricao: string;
  ordem: number;
  curso_id: string;
  materiais: CourseMaterial[];
}

interface CourseWithModules {
  id: string;
  titulo: string;
  descricao: string;
  duracao: string;
  nivel: string;
  imagem_capa: string;
  modulos: CourseModule[];
}

export const Dashboard = () => {
  const { user, profile, signOut, loading, logoutLoading } = useAuth();
  const navigate = useNavigate();
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [coursesWithModules, setCoursesWithModules] = useState<CourseWithModules[]>([]);
  const [activeTab, setActiveTab] = useState('cursos');
  const [dataLoading, setDataLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setDataLoading(true);

      // Buscar inscrições em cursos
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('inscricoes_cursos')
        .select(`
          *,
          curso:cursos(*)
        `)
        .eq('aluno_id', profile.id);

      if (enrollmentsError) throw enrollmentsError;
      
      // Filtrar apenas inscrições com cursos válidos
      const validEnrollments = (enrollments || []).filter(enrollment => enrollment.curso !== null);
      setCourseEnrollments(validEnrollments);

      // Para admins, buscar todos os cursos disponíveis
      if (profile.role === 'admin') {
        const { data: allCoursesData, error: allCoursesError } = await supabase
          .from('cursos')
          .select('*')
          .order('created_at', { ascending: false });

        if (allCoursesError) throw allCoursesError;
        setAllCourses(allCoursesData || []);
      }

      // Buscar certificados
      const { data: certs, error: certsError } = await supabase
        .from('certificados_conclusao')
        .select('*')
        .in('inscricao_curso_id', (enrollments || []).map(e => e.id));

      if (certsError) throw certsError;
      
      // Adicionar o nome do aluno aos certificados
      const certificatesWithNames = (certs || []).map(cert => ({
        ...cert,
        aluno_nome: profile.nome
      }));
      
      setCertificates(certificatesWithNames);

      // Buscar cursos com módulos apenas se necessário
      if (enrollments && enrollments.length > 0) {
        const courseIds = enrollments.map(e => e.curso_id);
        
        const [coursesData, modulesData, materialsData] = await Promise.all([
          supabase.from('cursos').select('*').in('id', courseIds),
          supabase.from('curso_modulos').select('*').in('curso_id', courseIds).order('ordem'),
          supabase.from('modulo_materiais').select('*').eq('ativo', true).order('ordem')
        ]);

        if (coursesData.error) throw coursesData.error;
        if (modulesData.error) throw modulesData.error;
        if (materialsData.error) throw materialsData.error;

        // Organizar dados hierarquicamente
        const coursesWithModules: CourseWithModules[] = (coursesData.data || []).map(course => {
          const courseModules = (modulesData.data || [])
            .filter(module => module.curso_id === course.id)
            .map(module => ({
              ...module,
              materiais: (materialsData.data || []).filter(material => material.modulo_id === module.id)
            }));

          return {
            ...course,
            modulos: courseModules
          };
        });

        setCoursesWithModules(coursesWithModules);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    } finally {
      setDataLoading(false);
    }
  }, [profile?.id, profile?.role, profile?.nome]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Gerenciar inicialização da tab baseado no role - APENAS na primeira carga
  useEffect(() => {
    if (profile?.role === 'admin' && activeTab === 'cursos' && !localStorage.getItem('dashboard-tab-initialized')) {
      setActiveTab('gerenciar');
      localStorage.setItem('dashboard-tab-initialized', 'true');
    }
  }, [profile?.role]);

  useEffect(() => {
    if (profile?.id) {
      fetchUserData();
    }
  }, [profile?.id, fetchUserData]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 sm:gap-4 min-w-0">
               <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                 Mentoria Futura
               </h1>
               <Badge variant="secondary" className="hidden sm:inline-flex text-xs whitespace-nowrap">
                 {profile.role === 'aluno' ? 'Área do Aluno' : profile.role}
               </Badge>
             </div>

             <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
               <Button 
                 variant="ghost" 
                 size="sm" 
                 onClick={() => navigate('/')}
                 className="text-muted-foreground hover:text-foreground px-2 sm:px-3"
               >
                 <Home className="h-4 w-4 sm:mr-2" />
                 <span className="hidden sm:inline">Catálogo</span>
               </Button>
               
               <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
                 <User className="h-4 w-4" />
                 <span className="truncate max-w-32">{profile.nome}</span>
               </div>
               <UserProfile />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={signOut} 
                  disabled={logoutLoading}
                  className="px-2 sm:px-3"
                >
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{logoutLoading ? 'Saindo...' : 'Sair'}</span>
                </Button>
             </div>
           </div>
        </div>
      </header>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar - Profile */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="lg:sticky lg:top-24">
              <CardHeader className="text-center pb-4 sm:pb-6 px-3 sm:px-6">
                <Avatar className="h-12 sm:h-16 lg:h-20 w-12 sm:w-16 lg:w-20 mx-auto mb-2 sm:mb-3 lg:mb-4">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm sm:text-lg lg:text-xl">
                    {getInitials(profile.nome)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-base sm:text-lg lg:text-xl truncate px-1 sm:px-2">{profile.nome}</CardTitle>
                <CardDescription className="text-xs sm:text-sm truncate px-1 sm:px-2">{profile.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 lg:px-6">
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">{profile.empresa}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Briefcase className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">{profile.departamento}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">{profile.cargo}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">{profile.unidade}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Cursos Ativos</span>
                    <span className="font-medium">{courseEnrollments.filter(c => c.status === 'ativo').length}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Certificados</span>
                    <span className="font-medium">{certificates.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
              <TabsList className={`grid w-full ${profile?.role === 'admin' ? 'grid-cols-4' : 'grid-cols-1'} h-auto p-1 gap-1`}>
                {profile?.role === 'admin' && (
                  <TabsTrigger value="gerenciar" className="flex items-center justify-center gap-1 py-2 px-1 text-xs">
                    <Users className="h-3 w-3" />
                    <span className="hidden xs:inline text-xs">Alunos</span>
                  </TabsTrigger>
                )}
                {profile?.role === 'admin' && (
                  <TabsTrigger value="inscricoes" className="flex items-center justify-center gap-1 py-2 px-1 text-xs">
                    <Mail className="h-3 w-3" />
                    <span className="hidden xs:inline text-xs">Inscrições</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="cursos" className="flex items-center justify-center gap-1 py-2 px-1 text-xs">
                  <BookOpen className="h-3 w-3" />
                  <span className="hidden xs:inline text-xs">{profile?.role === 'admin' ? 'Gerenciar' : 'Cursos'}</span>
                </TabsTrigger>
                {profile?.role === 'admin' && (
                  <TabsTrigger value="meus-cursos" className="flex items-center justify-center gap-1 py-2 px-1 text-xs">
                    <GraduationCap className="h-3 w-3" />
                    <span className="hidden xs:inline text-xs">Meus Cursos</span>
                  </TabsTrigger>
                )}
              </TabsList>

              {dataLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div>
              ) : (
                <>
                   {/* Admin Tab - Gerenciar Inscrições */}
                   {profile?.role === 'admin' && (
                     <TabsContent value="inscricoes" className="space-y-6">
                       {activeTab === 'inscricoes' && <EnrollmentManagement />}
                     </TabsContent>
                   )}

                   {/* Admin Tab - Gerenciar Alunos */}
                   {profile?.role === 'admin' && (
                     <TabsContent value="gerenciar" className="space-y-6">
                       {activeTab === 'gerenciar' && <StudentManagement />}
                     </TabsContent>
                   )}

                   {/* Cursos Tab */}
                   {profile?.role === 'admin' && (
                     <TabsContent value="cursos" className="space-y-6">
                       <div className="flex justify-between items-center">
                         <div>
                           <h2 className="text-2xl font-bold">Gerenciar Cursos</h2>
                           <p className="text-muted-foreground">Crie e gerencie os cursos da plataforma</p>
                         </div>
                         <CreateCourseDialog onCourseCreated={fetchUserData} />
                       </div>
                       
                       {/* Visualização administrativa de cursos */}
                       {allCourses.length === 0 ? (
                         <Card>
                           <CardContent className="text-center py-12">
                             <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                             <h3 className="text-lg font-semibold mb-2">Nenhum curso encontrado</h3>
                             <p className="text-muted-foreground">
                               Crie seu primeiro curso usando o botão "Novo Curso" acima.
                             </p>
                           </CardContent>
                         </Card>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                             {allCourses.map((course) => (
                               <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                 {course.imagem_capa && (
                                   <div className="relative aspect-video overflow-hidden">
                                     <img 
                                       src={course.imagem_capa} 
                                       alt={course.titulo}
                                       className="w-full h-full object-cover"
                                     />
                                     <div className="absolute top-2 right-2">
                                       <Badge variant={course.status === 'active' ? 'default' : course.status === 'draft' ? 'secondary' : 'outline'} className="text-xs">
                                         {course.status === 'active' ? 'Ativo' : course.status === 'draft' ? 'Rascunho' : course.status}
                                       </Badge>
                                     </div>
                                   </div>
                                 )}
                                 <CardHeader className="p-3 sm:p-4">
                                   <CardTitle className="text-sm sm:text-base line-clamp-2">{course.titulo}</CardTitle>
                                   <CardDescription className="text-xs sm:text-sm line-clamp-3">{course.descricao}</CardDescription>
                                 </CardHeader>
                                 <CardContent className="p-3 sm:p-4 pt-0">
                                   <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3 sm:mb-4">
                                     <div className="flex items-center gap-1">
                                       <Clock className="h-3 w-3" />
                                       <span>{course.duracao}</span>
                                     </div>
                                     <div className="flex items-center gap-1">
                                       <GraduationCap className="h-3 w-3" />
                                       <span>{course.nivel}</span>
                                     </div>
                                   </div>
                                   
                                   <div className="space-y-2">
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        <EditCourseDialog 
                                          course={course} 
                                          onCourseUpdated={fetchUserData}
                                        />
                                        <CreateModuleDialog 
                                          courseId={course.id} 
                                          courseTitle={course.titulo}
                                          onModuleCreated={fetchUserData}
                                        />
                                      </div>
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        <ViewModulesDialog 
                                          courseId={course.id}
                                          courseTitle={course.titulo}
                                          onModuleUpdated={fetchUserData}
                                        />
                                        <CourseStudentsDialog 
                                          courseId={course.id} 
                                          courseTitle={course.titulo}
                                        />
                                      </div>
                                   </div>
                                 </CardContent>
                               </Card>
                             ))}
                          </div>
                        )}
                     </TabsContent>
                   )}

                   {/* Nova aba: Meus Cursos - Para admins verem seus próprios cursos */}
                   {profile?.role === 'admin' && (
                     <TabsContent value="meus-cursos" className="space-y-6">
                       <div className="flex justify-between items-center">
                         <div>
                           <h2 className="text-2xl font-bold">Meus Cursos</h2>
                           <p className="text-muted-foreground">Seus cursos como aluno</p>
                         </div>
                       </div>
                       
                       {courseEnrollments.length === 0 ? (
                         <Card>
                           <CardContent className="text-center py-12">
                             <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                             <h3 className="text-lg font-semibold mb-2">Nenhum curso encontrado</h3>
                             <p className="text-muted-foreground">
                               Você ainda não está inscrito em nenhum curso.
                             </p>
                           </CardContent>
                         </Card>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {courseEnrollments.map((enrollment) => (
                              <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow relative">
                                {/* Badges/Selos no topo do card */}
                                <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                                  {Number(enrollment.progresso) >= 100 && (
                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white shadow-lg text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Concluído
                                    </Badge>
                                  )}
                                  {(() => {
                                    const certificate = certificates.find(cert => cert.inscricao_curso_id === enrollment.id);
                                    return certificate && certificate.status === 'aprovado' ? (
                                      <Badge variant="default" className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg text-xs">
                                        <Award className="h-3 w-3 mr-1" />
                                        Certificado
                                      </Badge>
                                    ) : null;
                                  })()}
                                </div>

                                {/* Imagem de capa do curso se disponível */}
                                {enrollment.curso?.imagem_capa && (
                                  <div className="relative aspect-video overflow-hidden">
                                    <img 
                                      src={enrollment.curso.imagem_capa} 
                                      alt={enrollment.curso?.titulo || 'Curso'}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}

                                <CardHeader className="p-3 sm:p-4">
                                  <CardTitle className="text-sm sm:text-base line-clamp-2">{enrollment.curso?.titulo || 'Curso não encontrado'}</CardTitle>
                                  <CardDescription className="text-xs sm:text-sm line-clamp-3">{enrollment.curso?.descricao || 'Informações do curso não disponíveis'}</CardDescription>
                                </CardHeader>

                                <CardContent className="p-3 sm:p-4 pt-0">
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3 sm:mb-4">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{enrollment.curso?.duracao || 'Duração não informada'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <GraduationCap className="h-3 w-3" />
                                      <span>{enrollment.curso?.nivel || 'Nível não informado'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>Iniciado em {formatDateWithoutTimezone(enrollment.data_inscricao)}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-xs">
                                      <span>Progresso</span>
                                      <span className="font-medium">{enrollment.progresso}%</span>
                                    </div>
                                    <Progress value={enrollment.progresso} className="h-1" />
                                  </div>

                                  <div className="space-y-2">
                                    <CourseModulesViewer
                                      courseId={enrollment.curso_id}
                                      courseTitle={enrollment.curso?.titulo || 'Curso'}
                                    />
                                    {Number(enrollment.progresso) >= 100 && (() => {
                                      const certificate = certificates.find(cert => cert.inscricao_curso_id === enrollment.id);
                                      return certificate ? (
                                        <StorageCertificateViewer certificate={certificate} />
                                      ) : (
                                        <Button variant="outline" className="w-full text-xs" size="sm" disabled>
                                          <Award className="h-3 w-3 mr-1" />
                                          Certificado não encontrado
                                        </Button>
                                      );
                                    })()}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                     </TabsContent>
                   )}

                   {/* Aba Cursos original para não-admins */}
                   {profile?.role !== 'admin' && (
                     <TabsContent value="cursos" className="space-y-6">
                       {courseEnrollments.length === 0 ? (
                         <Card>
                           <CardContent className="text-center py-12">
                             <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                             <h3 className="text-lg font-semibold mb-2">Nenhum curso encontrado</h3>
                             <p className="text-muted-foreground">
                               Você ainda não está inscrito em nenhum curso.
                             </p>
                           </CardContent>
                         </Card>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {courseEnrollments.map((enrollment) => (
                              <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow relative">
                                {/* Badges/Selos no topo do card */}
                                <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                                  {Number(enrollment.progresso) >= 100 && (
                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white shadow-lg text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Concluído
                                    </Badge>
                                  )}
                                  {(() => {
                                    const certificate = certificates.find(cert => cert.inscricao_curso_id === enrollment.id);
                                    return certificate && certificate.status === 'aprovado' ? (
                                      <Badge variant="default" className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg text-xs">
                                        <Award className="h-3 w-3 mr-1" />
                                        Certificado
                                      </Badge>
                                    ) : null;
                                  })()}
                                </div>

                                {/* Imagem de capa do curso se disponível */}
                                {enrollment.curso?.imagem_capa && (
                                  <div className="relative aspect-video overflow-hidden">
                                    <img 
                                      src={enrollment.curso.imagem_capa} 
                                      alt={enrollment.curso?.titulo || 'Curso'}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}

                                <CardHeader className="p-3 sm:p-4">
                                  <CardTitle className="text-sm sm:text-base line-clamp-2">{enrollment.curso?.titulo || 'Curso não encontrado'}</CardTitle>
                                  <CardDescription className="text-xs sm:text-sm line-clamp-3">{enrollment.curso?.descricao || 'Informações do curso não disponíveis'}</CardDescription>
                                </CardHeader>

                                <CardContent className="p-3 sm:p-4 pt-0">
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3 sm:mb-4">
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{enrollment.curso?.duracao || 'Duração não informada'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <GraduationCap className="h-3 w-3" />
                                      <span>{enrollment.curso?.nivel || 'Nível não informado'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>Iniciado em {formatDateWithoutTimezone(enrollment.data_inscricao)}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-xs">
                                      <span>Progresso</span>
                                      <span className="font-medium">{enrollment.progresso}%</span>
                                    </div>
                                    <Progress value={enrollment.progresso} className="h-1" />
                                  </div>

                                  <div className="space-y-2">
                                    <CourseModulesViewer
                                      courseId={enrollment.curso_id}
                                      courseTitle={enrollment.curso?.titulo || 'Curso'}
                                    />
                                    {Number(enrollment.progresso) >= 100 && (() => {
                                      const certificate = certificates.find(cert => cert.inscricao_curso_id === enrollment.id);
                                      return certificate ? (
                                        <StorageCertificateViewer certificate={certificate} />
                                      ) : (
                                        <Button variant="outline" className="w-full text-xs" size="sm" disabled>
                                          <Award className="h-3 w-3 mr-1" />
                                          Certificado não encontrado
                                        </Button>
                                      );
                                    })()}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                     </TabsContent>
                   )}

                </>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};