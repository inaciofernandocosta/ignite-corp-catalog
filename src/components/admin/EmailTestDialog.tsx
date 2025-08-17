import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2, TestTube } from "lucide-react";

interface EmailTestDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EmailTestDialog({ isOpen, onOpenChange }: EmailTestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const { toast } = useToast();

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Erro",
        description: "Por favor, informe um e-mail para teste.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Testando envio de e-mail para:', testEmail);
      
      // Primeiro, vamos criar uma inscrição fictícia para testar
      const mockEnrollmentData = {
        enrollment_id: "test-" + Date.now(),
        course_id: "test-course-id",
        student_id: "test-student-id",
        enrollment_date: new Date().toISOString()
      };

      const { data, error } = await supabase.functions.invoke('send-course-enrollment-confirmation', {
        body: {
          enrollmentData: mockEnrollmentData
        }
      });

      if (error) {
        console.error('Erro ao testar e-mail:', error);
        throw error;
      }

      console.log('Resposta do teste de e-mail:', data);

      toast({
        title: "Teste realizado!",
        description: "Verifique os logs da edge function para ver o resultado.",
      });

      onOpenChange?.(false);

    } catch (error) {
      console.error('Erro ao testar e-mail:', error);
      toast({
        title: "Erro no teste",
        description: "Verifique os logs da edge function para mais detalhes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TestTube className="w-4 h-4 mr-2" />
          Testar E-mail
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Testar Envio de E-mail
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">E-mail de Teste</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="teste@exemplo.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="bg-muted/50 p-4 rounded-lg text-sm">
            <p className="font-medium mb-2">⚠️ Importante sobre o domínio:</p>
            <p className="text-muted-foreground">
              Para que os e-mails sejam enviados corretamente, o domínio <code>mentoriafutura.com.br</code> 
              precisa estar validado no Resend. Se não estiver configurado, você pode:
            </p>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
              <li>Validar o domínio no painel do Resend</li>
              <li>Ou usar temporariamente <code>onboarding@resend.dev</code></li>
            </ol>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleTestEmail}
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Testar Envio
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}