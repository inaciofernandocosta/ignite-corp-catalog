import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  MapPin, 
  User,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react';

interface Student {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  departamento?: string;
  cargo?: string;
  unidade?: string;
  status: string;
  ativo: boolean;
  created_at: string;
}

interface StudentCardProps {
  student: Student;
  onStudentUpdate: () => void;
}

export const StudentCard = ({ student, onStudentUpdate }: StudentCardProps) => {
  const { toast } = useToast();

  const handleRemoveStudent = async () => {
    try {
      const { error } = await supabase
        .from('inscricoes_mentoria')
        .update({ ativo: false, status: 'removido' })
        .eq('id', student.id);

      if (error) throw error;

      toast({
        title: 'Aluno removido',
        description: `${student.nome || 'Usuário'} foi removido com sucesso.`,
      });

      onStudentUpdate();
    } catch (error) {
      console.error('Erro ao remover aluno:', error);
      toast({
        title: 'Erro ao remover',
        description: 'Não foi possível remover o aluno.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = student.status === 'aprovado' ? 'rejeitado' : 'aprovado';
    
    try {
      const { error } = await supabase
        .from('inscricoes_mentoria')
        .update({ status: newStatus })
        .eq('id', student.id);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: `${student.nome || 'Usuário'} foi ${newStatus === 'aprovado' ? 'aprovado' : 'rejeitado'}.`,
      });

      onStudentUpdate();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = () => {
    switch (student.status) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Aprovado</Badge>;
      case 'rejeitado':
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">{student.status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">{student.nome || 'Nome não informado'}</h3>
              {getStatusBadge()}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {formatDate(student.created_at)}
            </div>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3 mb-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Mail className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-foreground truncate">{student.email}</span>
          </div>

          {student.telefone && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Phone className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">{student.telefone}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {student.empresa && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Building className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground truncate">{student.empresa}</span>
              </div>
            )}

            {student.departamento && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Briefcase className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground truncate">{student.departamento}</span>
              </div>
            )}

            {student.cargo && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <User className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground truncate">{student.cargo}</span>
              </div>
            )}

            {student.unidade && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <MapPin className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground truncate">{student.unidade}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            className="flex-1 text-xs sm:text-sm"
          >
            {student.status === 'aprovado' ? (
              <>
                <UserX className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
                Rejeitar
              </>
            ) : (
              <>
                <UserCheck className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
                Aprovar
              </>
            )}
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemoveStudent}
            className="flex-1 text-xs sm:text-sm"
          >
            <Trash2 className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
            Remover
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};