import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Building, Briefcase, MapPin, Calendar, BarChart3, CheckCircle, Clock } from 'lucide-react';

interface CourseStudent {
  id: string;
  data_inscricao: string;
  status: string;
  progresso: number;
  ultima_atividade: string;
  aluno: {
    id: string;
    nome: string;
    email: string;
    empresa: string;
    departamento: string;
    cargo: string;
    unidade: string;
  };
}

interface CourseStudentsDialogProps {
  courseId: string;
  courseTitle: string;
}

export const CourseStudentsDialog: React.FC<CourseStudentsDialogProps> = ({ courseId, courseTitle }) => {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('inscricoes_cursos')
        .select(`
          *,
          aluno:inscricoes_mentoria!inscricoes_cursos_aluno_id_fkey(
            id,
            nome,
            email,
            empresa,
            departamento,
            cargo,
            unidade
          )
        `)
        .eq('curso_id', courseId)
        .order('data_inscricao', { ascending: false });

      if (error) throw error;

      setStudents(data || []);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      toast({
        title: 'Erro ao carregar alunos',
        description: 'Não foi possível carregar a lista de alunos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open, courseId]);

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativo':
        return 'default';
      case 'concluido':
        return 'success';
      case 'pausado':
        return 'secondary';
      case 'cancelado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-blue-600';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex-1">
          <User className="h-3 w-3 mr-1" />
          Ver Alunos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Alunos Inscritos - {courseTitle}
          </DialogTitle>
          <DialogDescription>
            Lista de todos os alunos inscritos neste curso com informações de progresso.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando alunos...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum aluno inscrito</h3>
              <p className="text-muted-foreground">
                Este curso ainda não possui alunos inscritos.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Total de alunos: <span className="font-semibold text-foreground">{students.length}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Concluíram: <span className="font-semibold text-green-600">
                    {students.filter(s => s.progresso >= 100).length}
                  </span>
                </div>
              </div>

              {students.map((enrollment) => (
                <Card key={enrollment.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                            {getInitials(enrollment.aluno.nome)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg">{enrollment.aluno.nome}</h4>
                            <Badge variant={getStatusColor(enrollment.status)}>
                              {enrollment.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {enrollment.aluno.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {enrollment.aluno.empresa}
                            </div>
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {enrollment.aluno.cargo}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {enrollment.aluno.unidade}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2">
                              <BarChart3 className={`h-4 w-4 ${getProgressColor(enrollment.progresso)}`} />
                              <div>
                                <span className="text-xs text-muted-foreground">Progresso</span>
                                <div className={`font-semibold ${getProgressColor(enrollment.progresso)}`}>
                                  {enrollment.progresso}%
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="text-xs text-muted-foreground">Inscrito em</span>
                                <div className="font-semibold">
                                  {formatDate(enrollment.data_inscricao)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <span className="text-xs text-muted-foreground">Última atividade</span>
                                <div className="font-semibold">
                                  {formatDate(enrollment.ultima_atividade)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};