import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminImpersonation } from '@/hooks/useAdminImpersonation';
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
  BookOpen,
  Activity
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
import { CertificateManagement } from '@/components/admin/CertificateManagement';
import { UserProfile } from '@/components/UserProfile';
import { CourseModulesViewer } from '@/components/student/CourseModulesViewer';
import { StudentImpersonationDialog } from '@/components/admin/StudentImpersonationDialog';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import { AdminUserAccess } from '@/components/admin/AdminUserAccess';

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
  const { user, profile, signOut, loading, logoutLoading, getImpersonatedStudent, isImpersonating } = useAuth();
  const { impersonatedStudent } = useAdminImpersonation();
  const navigate = useNavigate();

  // Verificar autenticação e redirecionar se necessário
  useEffect(() => {
    if (!loading && !user) {
      console.log('Dashboard: Usuário não logado, redirecionando para /auth');
      navigate('/auth');
    }
  }, [loading, user, navigate]);
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [coursesWithModules, setCoursesWithModules] = useState<CourseWithModules[]>([]);
  const [activeTab, setActiveTab] = useState('cursos');
  const [dataLoading, setDataLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    if (!profile?.id) return;

      // Verificar se admin está impersonando um aluno - sem usar função como dependência
      let impersonatedStudent = null;
      try {
        const stored = localStorage.getItem('admin_impersonation');
        if (stored) {
          impersonatedStudent = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Error parsing impersonation data:', error);
      }

      const targetUserId = impersonatedStudent ? impersonatedStudent.id : profile?.id;

      try {
        setDataLoading(true);

        // Buscar inscrições em cursos (do aluno ou do admin impersonando)
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('inscricoes_cursos')
          .select(`
            *,
            curso:cursos(*)
          `)
          .eq('aluno_id', targetUserId);

        if (enrollmentsError) throw enrollmentsError;
        
        // Filtrar apenas inscrições com cursos válidos
        const validEnrollments = (enrollments || []).filter(enrollment => enrollment.curso !== null);
        setCourseEnrollments(validEnrollments);

      // Para admins não impersonando, buscar todos os cursos disponíveis
      if (profile?.role === 'admin' && !impersonatedStudent) {
        const { data: allCoursesData, error: allCoursesError } = await supabase
          .from('cursos')
          .select('*')
          .order('created_at', { ascending: false });

        if (allCoursesError) throw allCoursesError;
        setAllCourses(allCoursesData || []);
      } else {
        // Se está impersonando, limpar a lista de todos os cursos
        setAllCourses([]);
      }

      // Buscar certificados (do aluno ou do admin impersonando)
      const { data: certs, error: certsError } = await supabase
        .from('certificados_conclusao')
        .select('*')
        .in('inscricao_curso_id', (enrollments || []).map(e => e.id));

      if (certsError) throw certsError;
      
      // Adicionar o nome do aluno aos certificados
      const studentName = impersonatedStudent ? impersonatedStudent.nome : profile?.nome;
      const certificatesWithNames = (certs || []).map(cert => ({
        ...cert,
        aluno_nome: studentName
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
  }, [profile?.id, profile?.role]);

  // Gerenciar inicialização da tab baseado no role - APENAS na primeira carga
  useEffect(() => {
    if (profile?.role === 'admin' && activeTab === 'cursos' && !localStorage.getItem('dashboard-tab-initialized')) {
      setActiveTab('gerenciar');
      localStorage.setItem('dashboard-tab-initialized', 'true');
    }
  }, [profile?.role]);

  // Controle da impersonação sem dependência circular
  const [lastImpersonationCheck, setLastImpersonationCheck] = useState(() => {
    return localStorage.getItem('admin_impersonation') || 'none';
  });

  // Carregar dados quando necessário
  useEffect(() => {
    if (profile?.id) {
      fetchUserData();
    }
  }, [profile?.id, fetchUserData]);

  // Monitorar mudanças na impersonação
  useEffect(() => {
    const checkImpersonation = () => {
      const current = localStorage.getItem('admin_impersonation') || 'none';
      if (current !== lastImpersonationCheck) {
        setLastImpersonationCheck(current);
        if (profile?.id) {
          fetchUserData();
        }
      }
    };

    // Check immediately
    checkImpersonation();

    // Set up interval for periodic checks (only when component is mounted)
    const interval = setInterval(checkImpersonation, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [lastImpersonationCheck, profile?.id, fetchUserData]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Conta não encontrada</h3>
            <p className="text-muted-foreground mb-6">
              Não foi possível encontrar seus dados no sistema. Entre em contato com o administrador.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={signOut} 
                variant="outline" 
                className="w-full"
                disabled={logoutLoading}
              >
                {logoutLoading ? 'Saindo...' : 'Entrar com outra conta'}
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                variant="ghost" 
                className="w-full"
              >
                Voltar ao início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Impersonation Banner */}
      {profile?.role === 'admin' && isImpersonating() && (
        <div className="sticky top-0 z-50">
          <ImpersonationBanner />
        </div>
      )}
      
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 sm:py-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 sm:gap-4 min-w-0">
               <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                 Mentoria Futura
               </h1>
                <Badge variant="secondary" className="hidden sm:inline-flex text-xs whitespace-nowrap">
                  {profile?.role === 'aluno' ? 'Área do Aluno' : profile?.role || 'Usuário'}
                </Badge>
             </div>

             <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
               {profile?.role === 'admin' && !isImpersonating() && (
                 <StudentImpersonationDialog />
               )}
               
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
                  <span className="truncate max-w-32">{profile?.nome}</span>
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
                     {getInitials(profile?.nome || 'Usuario')}
                   </AvatarFallback>
                 </Avatar>
                 <CardTitle className="text-base sm:text-lg lg:text-xl truncate px-1 sm:px-2">{profile?.nome}</CardTitle>
                 <CardDescription className="text-xs sm:text-sm truncate px-1 sm:px-2">{profile?.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-4 lg:px-6">
                 <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                   <div className="flex items-center gap-2 min-w-0">
                     <Building className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                     <span className="truncate text-xs sm:text-sm">{profile?.empresa}</span>
                   </div>
                   <div className="flex items-center gap-2 min-w-0">
                     <Briefcase className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                     <span className="truncate text-xs sm:text-sm">{profile?.departamento}</span>
                   </div>
                   <div className="flex items-center gap-2 min-w-0">
                     <User className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                     <span className="truncate text-xs sm:text-sm">{profile?.cargo}</span>
                   </div>
                   <div className="flex items-center gap-2 min-w-0">
                     <MapPin className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                     <span className="truncate text-xs sm:text-sm">{profile?.unidade}</span>
                   </div>
                 </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Cursos Matriculados</span>
                    <span className="font-medium">{courseEnrollments.length}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Cursos Concluídos</span>
                    <span className="font-medium">{courseEnrollments.filter(c => c.status === 'concluido').length}</span>
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
            {/* Show impersonation info in sidebar when impersonating */}
            {profile?.role === 'admin' && isImpersonating() && (
              <div className="mb-4">
                <ImpersonationBanner />
              </div>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
              <TabsList className={`grid w-full ${profile?.role === 'admin' && !isImpersonating() ? 'grid-cols-6' : 'grid-cols-1'} h-auto p-1 gap-1`}>
                {profile?.role === 'admin' && !isImpersonating() && (
                  <TabsTrigger value="gerenciar" className="flex items-center justify-center gap-1 py-2 px-1 text-xs">
                    <Users className="h-3 w-3" />
                    <span className="hidden xs:inline text-xs">Alunos</span>
                  </TabsTrigger>
                )}
                {profile?.role === 'admin' && !isImpersonating() && (
                  <TabsTrigger value="inscricoes" className="flex items-center justify-center gap-1 py-2 px-1 text-xs">
                    <Mail className="h-3 w-3" />
                    <span className="hidden xs:inline text-xs">Inscrições</span>
                  </TabsTrigger>
                )}
                {profile?.role === 'admin' && !isImpersonating() && (
                  <TabsTrigger value="certificados" className="flex items-center justify-center gap-1 py-2 px-1 text-xs">
                    <Award className="h-3 w-3" />
                    <span className="hidden xs:inline text-xs">Certificados</span>
                  </TabsTrigger>
                )}
                {profile?.role === 'admin' && !isImpersonating() && (
                  <TabsTrigger value="acessos" className="flex items-center justify-center gap-1 py-2 px-1 text-xs">
                    <Activity className="h-3 w-3" />
                    <span className="hidden xs:inline text-xs">Acessos</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="cursos" className="flex items-center justify-center gap-1 py-2 px-1 text-xs">
                  <BookOpen className="h-3 w-3" />
                  <span className="hidden xs:inline text-xs">
                    {profile?.role === 'admin' && !isImpersonating() ? 'Gerenciar' : 'Cursos'}
                  </span>
                </TabsTrigger>
                {profile?.role === 'admin' && !isImpersonating() && (
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
                   {profile?.role === 'admin' && !isImpersonating() && (
                     <TabsContent value="inscricoes" className="space-y-6">
                       {activeTab === 'inscricoes' && <EnrollmentManagement />}
                     </TabsContent>
                   )}

                   {/* Admin Tab - Gerenciar Alunos */}
                   {profile?.role === 'admin' && !isImpersonating() && (
                     <TabsContent value="gerenciar" className="space-y-6">
                       {activeTab === 'gerenciar' && <StudentManagement />}
                     </TabsContent>
                   )}

                    {/* Admin Tab - Gerenciar Certificados */}
                    {profile?.role === 'admin' && !isImpersonating() && (
                      <TabsContent value="certificados" className="space-y-6">
                        {activeTab === 'certificados' && <CertificateManagement />}
                      </TabsContent>
                    )}

                    {/* Admin Tab - Acessos dos Usuários */}
                    {profile?.role === 'admin' && !isImpersonating() && (
                      <TabsContent value="acessos" className="space-y-6">
                        {activeTab === 'acessos' && <AdminUserAccess />}
                      </TabsContent>
                    )}

                     {/* Cursos Tab - Gerenciar (apenas para admin não impersonando) */}
                    {profile?.role === 'admin' && !isImpersonating() && (
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

                    {/* Aba Cursos para alunos ou admin impersonando */}
                    {(profile?.role !== 'admin' || isImpersonating()) && (
                      <TabsContent value="cursos" className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h2 className="text-2xl font-bold">Meus Cursos</h2>
                            <p className="text-muted-foreground">
                              {isImpersonating() ? 
                                `Cursos de ${impersonatedStudent?.nome}` : 
                                'Seus cursos matriculados'
                              }
                            </p>
                          </div>
                        </div>
                        
                        {courseEnrollments.length === 0 ? (
                          <Card>
                            <CardContent className="text-center py-12">
                              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <h3 className="text-lg font-semibold mb-2">Nenhum curso encontrado</h3>
                              <p className="text-muted-foreground">
                                {isImpersonating() ? 
                                  'Este aluno ainda não está inscrito em nenhum curso.' :
                                  'Você ainda não está inscrito em nenhum curso.'
                                }
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