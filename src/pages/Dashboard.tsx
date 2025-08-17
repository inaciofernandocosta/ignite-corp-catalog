import React, { useState, useEffect } from 'react';
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
import { UserProfile } from '@/components/UserProfile';

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
  };
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
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [coursesWithModules, setCoursesWithModules] = useState<CourseWithModules[]>([]);
  const [activeTab, setActiveTab] = useState(profile?.role === 'admin' ? 'gerenciar' : 'cursos');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile?.id) {
      fetchUserData();
    }
  }, [profile]);

  const fetchUserData = async () => {
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
      setCourseEnrollments(enrollments || []);

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

      // Buscar cursos com módulos e materiais organizados
      if (enrollments && enrollments.length > 0) {
        const courseIds = enrollments.map(e => e.curso_id);
        
        // Buscar cursos
        const { data: courses, error: coursesError } = await supabase
          .from('cursos')
          .select('*')
          .in('id', courseIds);

        if (coursesError) throw coursesError;

        // Buscar módulos dos cursos
        const { data: modules, error: modulesError } = await supabase
          .from('curso_modulos')
          .select('*')
          .in('curso_id', courseIds)
          .order('ordem');

        if (modulesError) throw modulesError;

        // Buscar materiais dos módulos
        let materials: CourseMaterial[] = [];
        if (modules && modules.length > 0) {
          const moduleIds = modules.map(m => m.id);
          
          const { data: materialsData, error: materialsError } = await supabase
            .from('modulo_materiais')
            .select('*')
            .in('modulo_id', moduleIds)
            .eq('ativo', true)
            .order('ordem');

          if (materialsError) throw materialsError;
          materials = materialsData || [];
        }

        // Organizar dados hierarquicamente
        const coursesWithModules: CourseWithModules[] = (courses || []).map(course => {
          const courseModules = (modules || [])
            .filter(module => module.curso_id === course.id)
            .map(module => ({
              ...module,
              materiais: materials.filter(material => material.modulo_id === module.id)
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
  };

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
               <Button variant="outline" size="sm" onClick={signOut} className="px-2 sm:px-3">
                 <LogOut className="h-4 w-4 sm:mr-2" />
                 <span className="hidden sm:inline">Sair</span>
               </Button>
             </div>
           </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar - Profile */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="lg:sticky lg:top-24">
              <CardHeader className="text-center pb-4 sm:pb-6">
                <Avatar className="h-16 sm:h-20 w-16 sm:w-20 mx-auto mb-3 sm:mb-4">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-lg sm:text-xl">
                    {getInitials(profile.nome)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg sm:text-xl truncate px-2">{profile.nome}</CardTitle>
                <CardDescription className="text-sm truncate px-2">{profile.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{profile.empresa}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{profile.departamento}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{profile.cargo}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{profile.unidade}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cursos Ativos</span>
                    <span className="font-medium">{courseEnrollments.filter(c => c.status === 'ativo').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
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
              <TabsList className={`grid w-full ${profile?.role === 'admin' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} h-auto p-1`}>
                {profile?.role === 'admin' && (
                  <TabsTrigger value="gerenciar" className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                    <Users className="h-3 sm:h-4 w-3 sm:w-4" />
                    <span className="hidden sm:inline">Gerenciar Alunos</span>
                    <span className="sm:hidden">Alunos</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="cursos" className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                  <BookOpen className="h-3 sm:h-4 w-3 sm:w-4" />
                  <span className="hidden sm:inline">{profile?.role === 'admin' ? 'Cursos' : 'Meus Cursos'}</span>
                  <span className="sm:hidden">Cursos</span>
                </TabsTrigger>
                <TabsTrigger value="certificados" className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                  <Award className="h-3 sm:h-4 w-3 sm:w-4" />
                  <span className="hidden sm:inline">Certificados</span>
                  <span className="sm:hidden">Certs</span>
                </TabsTrigger>
                <TabsTrigger value="materiais" className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-3 text-xs sm:text-sm">
                  <FileText className="h-3 sm:h-4 w-3 sm:w-4" />
                  <span className="hidden sm:inline">Materiais</span>
                  <span className="sm:hidden">Docs</span>
                </TabsTrigger>
              </TabsList>

              {dataLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div>
              ) : (
                <>
                  {/* Admin Tab - Gerenciar Alunos */}
                  {profile?.role === 'admin' && (
                    <TabsContent value="gerenciar" className="space-y-6">
                      <StudentManagement />
                    </TabsContent>
                  )}

                   {/* Cursos Tab */}
                   <TabsContent value="cursos" className="space-y-6">
                     {profile?.role === 'admin' && (
                       <div className="flex justify-between items-center">
                         <div>
                           <h2 className="text-2xl font-bold">Gerenciar Cursos</h2>
                           <p className="text-muted-foreground">Crie e gerencie os cursos da plataforma</p>
                         </div>
                         <CreateCourseDialog onCourseCreated={fetchUserData} />
                       </div>
                     )}
                     
                      {profile?.role === 'admin' ? (
                        // Visualização em grade para administradores
                        allCourses.length === 0 ? (
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
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                       <Badge variant={course.status === 'active' ? 'default' : course.status === 'draft' ? 'secondary' : 'outline'}>
                                         {course.status === 'active' ? 'Ativo' : course.status === 'draft' ? 'Rascunho' : course.status}
                                       </Badge>
                                     </div>
                                   </div>
                                 )}
                                 <CardHeader>
                                   <div className="flex items-start justify-between">
                                     <div className="space-y-1">
                                       <CardTitle className="text-lg line-clamp-2">{course.titulo}</CardTitle>
                                       {!course.imagem_capa && (
                                         <Badge variant={course.status === 'active' ? 'default' : course.status === 'draft' ? 'secondary' : 'outline'}>
                                           {course.status === 'active' ? 'Ativo' : course.status === 'draft' ? 'Rascunho' : course.status}
                                         </Badge>
                                       )}
                                     </div>
                                   </div>
                                    {course.data_inicio && (
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {formatDateWithoutTimezone(course.data_inicio)}
                                      </div>
                                    )}
                                 </CardHeader>
                                <CardContent>
                                  <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {course.duracao}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <GraduationCap className="h-3 w-3" />
                                        {course.nivel}
                                      </div>
                                    </div>
                                    
                                    {course.preco && (
                                      <div className="text-sm">
                                        <span className="text-muted-foreground">Preço: </span>
                                        <span className="font-semibold">R$ {Number(course.preco).toFixed(2)}</span>
                                      </div>
                                    )}
                                    
                                      <div className="flex flex-col gap-2 mt-4">
                                        <div className="flex flex-col sm:flex-row gap-2">
                                          <EditCourseDialog course={course} onCourseUpdated={fetchUserData} />
                                          <CourseStudentsDialog courseId={course.id} courseTitle={course.titulo} />
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                          <CreateModuleDialog 
                                            courseId={course.id} 
                                            courseTitle={course.titulo}
                                            onModuleCreated={fetchUserData} 
                                          />
                                        </div>
                                      </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )
                      ) : (
                       // Visualização original para alunos
                       courseEnrollments.length === 0 ? (
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
                         <div className="grid gap-6">
                           {courseEnrollments.map((enrollment) => (
                             <Card key={enrollment.id} className="overflow-hidden">
                               <div className="grid md:grid-cols-3 gap-6 p-6">
                                 <div className="md:col-span-2 space-y-4">
                                   <div>
                                     <div className="flex items-center gap-2 mb-2">
                                       <h3 className="text-xl font-semibold">{enrollment.curso.titulo}</h3>
                                       <Badge variant={enrollment.status === 'ativo' ? 'default' : 'secondary'}>
                                         {enrollment.status}
                                       </Badge>
                                     </div>
                                     <p className="text-muted-foreground">{enrollment.curso.descricao}</p>
                                   </div>
                                   
                                   <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                     <div className="flex items-center gap-1">
                                       <Clock className="h-4 w-4" />
                                       {enrollment.curso.duracao}
                                     </div>
                                     <div className="flex items-center gap-1">
                                       <GraduationCap className="h-4 w-4" />
                                       {enrollment.curso.nivel}
                                     </div>
                                     <div className="flex items-center gap-1">
                                       <Calendar className="h-4 w-4" />
                                       Iniciado em {formatDateWithoutTimezone(enrollment.data_inscricao)}
                                     </div>
                                   </div>
                                   
                                   <div className="space-y-2">
                                     <div className="flex justify-between text-sm">
                                       <span>Progresso do curso</span>
                                       <span className="font-medium">{enrollment.progresso}%</span>
                                     </div>
                                     <Progress value={enrollment.progresso} className="h-2" />
                                   </div>
                                 </div>
                                 
                                 <div className="flex flex-col justify-between">
                                   <div className="space-y-2">
                                     {Number(enrollment.progresso) >= 100 ? (
                                       <Badge variant="default" className="w-fit">
                                         <CheckCircle className="h-3 w-3 mr-1" />
                                         Concluído
                                       </Badge>
                                     ) : (
                                       <Badge variant="secondary" className="w-fit">
                                         <PlayCircle className="h-3 w-3 mr-1" />
                                         Em andamento
                                       </Badge>
                                     )}
                                   </div>
                                   
                                    <div className="space-y-2 mt-4">
                                      <Button className="w-full" size="sm">
                                        <PlayCircle className="h-4 w-4 mr-2" />
                                        Continuar Curso
                                      </Button>
                                      {Number(enrollment.progresso) >= 100 && (() => {
                                        const certificate = certificates.find(cert => cert.inscricao_curso_id === enrollment.id);
                                        return certificate ? (
                                          <StorageCertificateViewer certificate={certificate} />
                                        ) : (
                                          <Button variant="outline" className="w-full" size="sm" disabled>
                                            <Award className="h-4 w-4 mr-2" />
                                            Certificado não encontrado
                                          </Button>
                                        );
                                      })()}
                                    </div>
                                 </div>
                               </div>
                             </Card>
                           ))}
                         </div>
                       )
                     )}
                   </TabsContent>

                  {/* Certificados Tab */}
                  <TabsContent value="certificados" className="space-y-6">
                    {certificates.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Nenhum certificado encontrado</h3>
                          <p className="text-muted-foreground">
                            Complete um curso para receber seu certificado.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {certificates.map((certificate) => (
                          <Card key={certificate.id}>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-yellow-500" />
                                    <h3 className="font-semibold">Certificado de Conclusão</h3>
                                    <Badge variant={certificate.status === 'emitido' ? 'default' : 'secondary'}>
                                      {certificate.status}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <p>Número: {certificate.numero_certificado}</p>
                                     <p>Data de conclusão: {formatDateWithoutTimezone(certificate.data_conclusao)}</p>
                                     <p>Data de emissão: {formatDateWithoutTimezone(certificate.data_emissao)}</p>
                                  </div>
                                </div>
                                
                                {certificate.certificado_pdf && (
                                  <Button size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Baixar PDF
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Materiais Tab */}
                  <TabsContent value="materiais" className="space-y-6">
                    {coursesWithModules.length === 0 ? (
                      <Card>
                        <CardContent className="text-center py-12">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Nenhum material encontrado</h3>
                          <p className="text-muted-foreground">
                            Os materiais do curso aparecerão aqui quando disponíveis.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-8">
                        {coursesWithModules.map((course) => (
                          <Card key={course.id}>
                            <CardHeader>
                              <div className="flex items-center gap-3">
                                <GraduationCap className="h-6 w-6 text-primary" />
                                <div>
                                  <CardTitle className="text-xl">{course.titulo}</CardTitle>
                                  <CardDescription>{course.descricao}</CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {course.modulos.length === 0 ? (
                                <div className="text-center py-8">
                                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                  <p className="text-muted-foreground">
                                    Nenhum módulo encontrado para este curso.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-6">
                                  {course.modulos.map((module) => (
                                    <div key={module.id} className="border-l-4 border-primary/20 pl-4">
                                       <div className="mb-4">
                                         <div className="flex items-center justify-between">
                                           <div>
                                             <h4 className="font-semibold text-lg flex items-center gap-2">
                                               <BookOpen className="h-5 w-5 text-secondary" />
                                               {module.titulo}
                                             </h4>
                                             {module.descricao && (
                                               <p className="text-sm text-muted-foreground mt-1">
                                                 {module.descricao}
                                               </p>
                                             )}
                                           </div>
                                           {profile?.role === 'admin' && (
                                             <div className="flex gap-2">
                                               <EditModuleDialog 
                                                 module={module} 
                                                 onModuleUpdated={fetchUserData} 
                                               />
                                               <ManageModuleMaterialsDialog 
                                                 moduleId={module.id}
                                                 moduleTitle={module.titulo}
                                                 onMaterialsUpdated={fetchUserData}
                                               />
                                             </div>
                                           )}
                                         </div>
                                       </div>

                                      {module.materiais.length === 0 ? (
                                        <div className="ml-6 py-4 text-center border border-dashed border-muted-foreground/30 rounded-lg">
                                          <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                                          <p className="text-sm text-muted-foreground">
                                            Nenhum material disponível neste módulo.
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="ml-6 grid gap-3">
                                          {module.materiais.map((material) => (
                                            <Card key={material.id} className="border-l-4 border-l-secondary/50">
                                              <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                  <div className="space-y-2 flex-1">
                                                    <div className="flex items-center gap-2">
                                                      <FileText className="h-4 w-4 text-blue-500" />
                                                      <h5 className="font-medium">{material.titulo}</h5>
                                                      <Badge variant="outline" className="text-xs">
                                                        {material.tipo}
                                                      </Badge>
                                                    </div>
                                                    {material.descricao && (
                                                      <p className="text-sm text-muted-foreground">
                                                        {material.descricao}
                                                      </p>
                                                    )}
                                                    <div className="flex gap-4 text-xs text-muted-foreground">
                                                      {material.formato && (
                                                        <span>Formato: {material.formato.toUpperCase()}</span>
                                                      )}
                                                      {material.arquivo_tamanho && (
                                                        <span>Tamanho: {formatFileSize(material.arquivo_tamanho)}</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                  
                                                  {material.url && (
                                                    <Button size="sm" asChild>
                                                      <a href={material.url} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Baixar
                                                      </a>
                                                    </Button>
                                                  )}
                                                </div>
                                              </CardContent>
                                            </Card>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};