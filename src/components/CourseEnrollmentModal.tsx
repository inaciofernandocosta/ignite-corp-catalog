import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, CheckCircle } from "lucide-react";
import { formatDateWithoutTimezone } from "@/lib/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CourseEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: string;
    title: string;
    startDate?: string;
    duration: string;
    slug?: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
  };
  existingEnrollment?: {
    status: string;
    data_inscricao: string;
  } | null;
}

export function CourseEnrollmentModal({ isOpen, onClose, course, user, existingEnrollment }: CourseEnrollmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleEnrollment = async () => {
    setIsLoading(true);
    
    try {
      // Criar nova inscrição com status pendente
      const { error } = await supabase
        .from('inscricoes_cursos')
        .insert({
          curso_id: course.id,
          aluno_id: user.id,
          status: 'pendente'
        });

      if (error) throw error;

      setIsSuccess(true);
      
      toast({
        title: "Inscrição realizada!",
        description: "Sua inscrição está aguardando aprovação. Você receberá um e-mail de confirmação em breve.",
      });

    } catch (error) {
      console.error('Erro ao realizar inscrição:', error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a inscrição. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {existingEnrollment ? 
              (existingEnrollment.status === 'pendente' ? "Aguardando Aprovação" : 
               existingEnrollment.status === 'aprovado' ? "Inscrito no Curso" : 
               existingEnrollment.status === 'reprovado' ? "Inscrição Negada" : "Confirmar Inscrição") :
              (isSuccess ? "Inscrição Confirmada!" : "Confirmar Inscrição")
            }
          </DialogTitle>
        </DialogHeader>

        {existingEnrollment ? (
          <div className="text-center space-y-4">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
              existingEnrollment.status === 'pendente' ? 'bg-warning/10' :
              existingEnrollment.status === 'aprovado' ? 'bg-success/10' :
              existingEnrollment.status === 'reprovado' ? 'bg-destructive/10' : 'bg-muted/10'
            }`}>
              <CheckCircle className={`w-8 h-8 ${
                existingEnrollment.status === 'pendente' ? 'text-warning' :
                existingEnrollment.status === 'aprovado' ? 'text-success' :
                existingEnrollment.status === 'reprovado' ? 'text-destructive' : 'text-muted-foreground'
              }`} />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{course.title}</h3>
              <p className="text-muted-foreground">
                {existingEnrollment.status === 'pendente' && 'Sua inscrição está sendo analisada pela equipe.'}
                {existingEnrollment.status === 'aprovado' && 'Sua inscrição foi aprovada! Você receberá mais informações em breve.'}
                {existingEnrollment.status === 'reprovado' && 'Infelizmente sua inscrição não foi aprovada desta vez.'}
              </p>
              <p className="text-sm text-muted-foreground">
                Inscrito em: {new Date(existingEnrollment.data_inscricao).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </div>
        ) : isSuccess ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{course.title}</h3>
              <p className="text-muted-foreground">
                Sua inscrição foi realizada com sucesso!
              </p>
              <p className="text-sm text-muted-foreground">
                Em breve você receberá um e-mail com a confirmação da vaga e mais detalhes sobre o curso.
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Course Info */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                <Badge variant="outline" className="mb-4">
                  Programa Presencial
                </Badge>
              </div>

              <div className="space-y-3">
                {course.duration && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{course.duration}</span>
                  </div>
                )}
                
                {course.startDate && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Início: {formatDateWithoutTimezone(course.startDate)}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>Poços de Caldas - MG</span>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Dados da inscrição:</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><strong>Nome:</strong> {user.name}</p>
                <p><strong>E-mail:</strong> {user.email}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEnrollment}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? "Inscrevendo..." : "Confirmar Inscrição"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}