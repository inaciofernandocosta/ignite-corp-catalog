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
        description: `${student.nome} foi removido com sucesso.`,
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
    const newStatus = student.status === 'ativo' ? 'rejeitado' : 'ativo';
    
    try {
      const { error } = await supabase
        .from('inscricoes_mentoria')
        .update({ status: newStatus })
        .eq('id', student.id);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: `${student.nome} foi ${newStatus === 'ativo' ? 'aprovado' : 'rejeitado'}.`,
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
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>;
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
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-foreground">{student.nome}</h3>
              {getStatusBadge()}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDate(student.created_at)}
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{student.email}</span>
          </div>

          {student.telefone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{student.telefone}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {student.empresa && (
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground truncate">{student.empresa}</span>
              </div>
            )}

            {student.departamento && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground truncate">{student.departamento}</span>
              </div>
            )}

            {student.cargo && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground truncate">{student.cargo}</span>
              </div>
            )}

            {student.unidade && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground truncate">{student.unidade}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            className="flex-1"
          >
            {student.status === 'ativo' ? (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Rejeitar
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Aprovar
              </>
            )}
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemoveStudent}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remover
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};