import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2 } from "lucide-react";

interface ResendEnrollmentEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: {
    id: string;
    curso_id: string;
    aluno_id: string;
    data_inscricao: string;
  };
  studentName: string;
  courseName: string;
}

export function ResendEnrollmentEmailDialog({ 
  isOpen, 
  onClose, 
  enrollment, 
  studentName, 
  courseName 
}: ResendEnrollmentEmailDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleResendEmail = async () => {
    setIsLoading(true);
    
    try {
      // Buscar dados completos da inscrição para verificar o status
      const { data: enrollmentData, error: fetchError } = await supabase
        .from('inscricoes_cursos')
        .select('status')
        .eq('id', enrollment.id)
        .single();

      if (fetchError) throw fetchError;

      let emailFunction = '';
      let emailData = {};

      // Determinar qual função de email usar baseado no status
      if (enrollmentData.status === 'aprovado') {
        emailFunction = 'send-approval-email';
        emailData = {
          enrollmentData: {
            enrollment_id: enrollment.id,
            course_id: enrollment.curso_id,
            student_id: enrollment.aluno_id,
            status: enrollmentData.status
          }
        };
      } else {
        emailFunction = 'send-course-enrollment-confirmation';
        emailData = {
          enrollmentData: {
            enrollment_id: enrollment.id,
            course_id: enrollment.curso_id,
            student_id: enrollment.aluno_id,
            enrollment_date: enrollment.data_inscricao
          }
        };
      }

      const { data, error } = await supabase.functions.invoke(emailFunction, {
        body: emailData
      });

      if (error) {
        console.error('Erro ao reenviar e-mail:', error);
        throw error;
      }

      const emailType = enrollmentData.status === 'aprovado' ? 'aprovação' : 'confirmação';
      toast({
        title: "E-mail reenviado!",
        description: `E-mail de ${emailType} foi enviado novamente para ${studentName}.`,
      });

      onClose();

    } catch (error) {
      console.error('Erro ao reenviar e-mail:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reenviar o e-mail. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Reenviar E-mail de Confirmação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Detalhes da Inscrição:</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><strong>Aluno:</strong> {studentName}</p>
              <p><strong>Curso:</strong> {courseName}</p>
              <p><strong>Data da Inscrição:</strong> {new Date(enrollment.data_inscricao).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Isso irá reenviar o e-mail de confirmação de inscrição para o aluno. 
            O e-mail contém os detalhes do curso e próximos passos.
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResendEmail}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Reenviar E-mail
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}