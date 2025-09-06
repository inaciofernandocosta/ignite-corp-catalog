import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminSync } from '@/hooks/useAdminSync';
import { Loader2, UserCheck, AlertTriangle, RotateCcw } from 'lucide-react';

export function UserSyncDialog() {
  const [open, setOpen] = useState(false);
  const [emailsText, setEmailsText] = useState('');
  const { isLoading, lastResults, diagnoseUsers, syncUsers, syncAllApproved } = useAdminSync();

  const parseEmails = (text: string): string[] => {
    return text
      .split(/[\n,;]/)
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));
  };

  const handleDiagnose = async () => {
    const emails = parseEmails(emailsText);
    if (emails.length === 0) {
      return;
    }
    await diagnoseUsers(emails);
  };

  const handleSync = async () => {
    const emails = parseEmails(emailsText);
    if (emails.length === 0) {
      return;
    }
    await syncUsers(emails);
  };

  const handleSyncAll = async () => {
    await syncAllApproved();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'skipped':
        return <Badge variant="secondary">Ignorado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const emailList = parseEmails(emailsText);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserCheck className="h-4 w-4" />
          Sincronizar Autenticação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Sincronizar Usuários de Autenticação</DialogTitle>
          <DialogDescription>
            Diagnosticar e corrigir inconsistências entre usuários aprovados e contas de autenticação.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 space-y-4">
          <div>
            <label className="text-sm font-medium">
              Lista de emails (um por linha ou separados por vírgula)
            </label>
            <Textarea
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              placeholder="jane.yamamoto@vilanova.com.br&#10;luis.dionisio@vilanova.com.br&#10;..."
              className="h-32 font-mono text-sm"
            />
            <div className="text-sm text-muted-foreground mt-1">
              {emailList.length} emails encontrados
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleDiagnose}
              disabled={isLoading || emailList.length === 0}
              variant="outline"
              className="gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
              Diagnosticar Lista
            </Button>
            
            <Button 
              onClick={handleSync}
              disabled={isLoading || emailList.length === 0}
              className="gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              Sincronizar Lista
            </Button>
            
            <Button 
              onClick={handleSyncAll}
              disabled={isLoading}
              variant="secondary"
              className="gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              Sincronizar Todos Aprovados
            </Button>
          </div>

          {lastResults && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Resultados da {lastResults.action === 'diagnose' ? 'Diagnose' : 'Sincronização'}</h3>
                <div className="flex gap-2 text-sm">
                  <span className="text-green-600">✅ {lastResults.summary.success}</span>
                  <span className="text-red-600">❌ {lastResults.summary.error}</span>
                  <span className="text-gray-600">⏭️ {lastResults.summary.skipped}</span>
                </div>
              </div>
              
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {lastResults.results.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex-1">
                        <div className="font-mono">{result.email}</div>
                        <div className="text-muted-foreground text-xs">{result.message}</div>
                        {result.details && (
                          <div className="text-xs text-blue-600 mt-1">
                            {JSON.stringify(result.details, null, 2)}
                          </div>
                        )}
                      </div>
                      <div className="ml-2">
                        {getStatusBadge(result.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}