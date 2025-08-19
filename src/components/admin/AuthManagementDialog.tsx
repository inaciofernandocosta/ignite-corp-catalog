import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key, Users, UserPlus } from 'lucide-react';

interface AuthManagementDialogProps {
  trigger?: React.ReactNode;
}

interface BackfillResult {
  email: string;
  nome: string;
  resultado: string;
}

const AuthManagementDialog: React.FC<AuthManagementDialogProps> = ({ trigger }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isRunningBackfill, setIsRunningBackfill] = useState(false);
  const [backfillResults, setBackfillResults] = useState<BackfillResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const createSingleAccount = async () => {
    if (!email.trim()) {
      toast({
        title: "Erro",
        description: "Digite um email válido",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-auth-account', {
        body: { email: email.trim() }
      });

      if (error) throw error;

      const result = data;
      if (result.success) {
        toast({
          title: "Sucesso",
          description: result.message,
        });
        setEmail('');
      } else {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      toast({
        title: "Erro",
        description: error.message || 'Erro ao criar conta de autenticação',
        variant: "destructive",
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const runBackfillAccounts = async () => {
    setIsRunningBackfill(true);
    setBackfillResults([]);
    setShowResults(false);

    try {
      const { data, error } = await supabase.functions.invoke('backfill-auth-accounts', {
        body: {}
      });

      if (error) throw error;

      const result = data;
      if (result.success) {
        setBackfillResults(result.resultados.detalhes);
        setShowResults(true);
        toast({
          title: "Backfill Concluído",
          description: `${result.resultados.sucessos} contas criadas, ${result.resultados.erros} erros`,
        });
      } else {
        toast({
          title: "Erro no Backfill",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Erro no backfill:', error);
      toast({
        title: "Erro",
        description: error.message || 'Erro ao executar backfill',
        variant: "destructive",
      });
    } finally {
      setIsRunningBackfill(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <Key className="h-4 w-4" />
      Gerenciar Autenticação
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Gerenciamento de Autenticação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Criar conta individual */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Criar Conta Individual
            </h3>
            <p className="text-sm text-muted-foreground">
              Criar conta de autenticação para um usuário específico que já está cadastrado.
            </p>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="email">Email do usuário</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <Button
                onClick={createSingleAccount}
                disabled={isCreatingAccount}
                className="w-full"
              >
                {isCreatingAccount ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Conta de Autenticação
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Backfill em massa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Migração em Massa (Backfill)
            </h3>
            <p className="text-sm text-muted-foreground">
              Criar contas de autenticação para todos os usuários ativos que ainda não possuem. 
              Isso irá criar contas com senha temporária "TempPassword123!" - usuários precisarão usar "Esqueci a senha".
            </p>

            <Alert>
              <AlertDescription>
                <strong>Atenção:</strong> Esta operação criará contas para todos os usuários aprovados e ativos 
                que ainda não possuem conta de autenticação. Use com cuidado!
              </AlertDescription>
            </Alert>

            <Button
              onClick={runBackfillAccounts}
              disabled={isRunningBackfill}
              variant="secondary"
              className="w-full"
            >
              {isRunningBackfill ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executando backfill...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Executar Backfill de Contas
                </>
              )}
            </Button>
          </div>

          {/* Resultados do backfill */}
          {showResults && backfillResults.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Resultados do Backfill</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {backfillResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md text-sm ${
                        result.resultado === 'Conta criada com sucesso'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <div className="font-medium">{result.nome} ({result.email})</div>
                      <div className={
                        result.resultado === 'Conta criada com sucesso'
                          ? 'text-green-700'
                          : 'text-red-700'
                      }>
                        {result.resultado}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthManagementDialog;