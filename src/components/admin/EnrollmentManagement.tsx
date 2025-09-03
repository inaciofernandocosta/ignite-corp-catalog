import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Calendar, User, BookOpen, MoreVertical, RefreshCw } from "lucide-react";
import { ResendEnrollmentEmailDialog } from "./ResendEnrollmentEmailDialog";
import { EmailTestDialog } from "./EmailTestDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Enrollment {
  id: string;
  data_inscricao: string;
  status: string;
  progresso: number;
  curso_id: string;
  aluno_id: string;
  cursos: {
    titulo: string;
    duracao: string;
    data_inicio: string | null;
  };
  inscricoes_mentoria: {
    nome: string;
    email: string;
    empresa: string;
  };
}

export function EnrollmentManagement() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [resendDialogOpen, setResendDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('inscricoes_cursos')
        .select(`
          id,
          data_inscricao,
          status,
          progresso,
          curso_id,
          aluno_id,
          cursos (
            titulo,
            duracao,
            data_inicio
          ),
          inscricoes_mentoria (
            nome,
            email,
            empresa
          )
        `)
        .order('data_inscricao', { ascending: false });

      if (error) throw error;
      
      setEnrollments(data || []);
    } catch (error) {
      console.error('Erro ao buscar inscrições:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as inscrições.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { variant: "secondary" as const, label: "Pendente" },
      aprovado: { variant: "default" as const, label: "Aprovado" },
      reprovado: { variant: "destructive" as const, label: "Reprovado" },
      concluido: { variant: "outline" as const, label: "Concluído" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      label: status
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleResendEmail = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setResendDialogOpen(true);
  };

  const handleResendApprovalEmail = async (enrollment: Enrollment) => {
    try {
      await supabase.functions.invoke('send-approval-email', {
        body: {
          enrollmentData: {
            enrollment_id: enrollment.id,
            course_id: enrollment.curso_id,
            student_id: enrollment.aluno_id,
            status: 'aprovado'
          }
        }
      });
      
      toast({
        title: "E-mail de aprovação reenviado!",
        description: `E-mail de aprovação foi enviado novamente para ${enrollment.inscricoes_mentoria?.nome || 'usuário'}.`,
      });
    } catch (error) {
      console.error('Erro ao reenviar e-mail de aprovação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reenviar o e-mail de aprovação.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (enrollmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('inscricoes_cursos')
        .update({ status: newStatus })
        .eq('id', enrollmentId);

      if (error) throw error;

      // Se estiver aprovando, enviar email de aprovação
      if (newStatus === 'aprovado') {
        const enrollment = enrollments.find(e => e.id === enrollmentId);
        if (enrollment) {
          try {
            await supabase.functions.invoke('send-approval-email', {
              body: {
                enrollmentData: {
                  enrollment_id: enrollment.id,
                  course_id: enrollment.curso_id,
                  student_id: enrollment.aluno_id,
                  status: newStatus
                }
              }
            });
            
            toast({
              title: "Aprovado com sucesso!",
              description: `Inscrição aprovada e e-mail enviado para ${enrollment.inscricoes_mentoria?.nome || 'usuário'}.`,
            });
          } catch (emailError) {
            console.error('Erro ao enviar e-mail de aprovação:', emailError);
            toast({
              title: "Status atualizado, mas e-mail não enviado",
              description: "A inscrição foi aprovada, mas houve problema no envio do e-mail.",
              variant: "destructive"
            });
          }
        }
      } else {
        toast({
          title: "Status atualizado!",
          description: `Status da inscrição foi alterado para ${newStatus}.`,
        });
      }

      fetchEnrollments(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Gerenciar Inscrições
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Gerenciar Inscrições ({enrollments.length})
            </CardTitle>
            <EmailTestDialog />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {enrollments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma inscrição encontrada.
              </p>
            ) : (
              enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{enrollment.cursos.titulo}</h3>
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                         <User className="w-4 h-4" />
                         <span>{enrollment.inscricoes_mentoria?.nome || 'Nome não informado'}</span>
                         <span>({enrollment.inscricoes_mentoria?.email || 'Email não informado'})</span>
                       </div>
                       {enrollment.inscricoes_mentoria?.empresa && (
                         <p className="text-sm text-muted-foreground">
                           {enrollment.inscricoes_mentoria.empresa}
                         </p>
                       )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(enrollment.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleResendEmail(enrollment)}>
                            <Mail className="w-4 h-4 mr-2" />
                            Reenviar E-mail
                          </DropdownMenuItem>
                          {enrollment.status === 'aprovado' && (
                            <DropdownMenuItem onClick={() => handleResendApprovalEmail(enrollment)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Reenviar E-mail de Aprovação
                            </DropdownMenuItem>
                          )}
                          {enrollment.status === 'pendente' && (
                            <>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(enrollment.id, 'aprovado')}>
                                Aprovar Inscrição
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(enrollment.id, 'reprovado')}>
                                Reprovar Inscrição
                              </DropdownMenuItem>
                            </>
                          )}
                          {enrollment.status === 'aprovado' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(enrollment.id, 'concluido')}>
                              Marcar como Concluído
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Data da Inscrição:</span>
                      <p className="font-medium">
                        {new Date(enrollment.data_inscricao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duração:</span>
                      <p className="font-medium">{enrollment.cursos.duracao}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Início:</span>
                      <p className="font-medium">
                        {enrollment.cursos.data_inicio 
                          ? new Date(enrollment.cursos.data_inicio).toLocaleDateString('pt-BR')
                          : 'A definir'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Progresso:</span>
                      <p className="font-medium">{enrollment.progresso}%</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedEnrollment && (
        <ResendEnrollmentEmailDialog
          isOpen={resendDialogOpen}
          onClose={() => {
            setResendDialogOpen(false);
            setSelectedEnrollment(null);
          }}
          enrollment={{
            id: selectedEnrollment.id,
            curso_id: selectedEnrollment.curso_id,
            aluno_id: selectedEnrollment.aluno_id,
            data_inscricao: selectedEnrollment.data_inscricao
          }}
          studentName={selectedEnrollment.inscricoes_mentoria?.nome || 'Nome não informado'}
          courseName={selectedEnrollment.cursos.titulo}
        />
      )}
    </>
  );
}