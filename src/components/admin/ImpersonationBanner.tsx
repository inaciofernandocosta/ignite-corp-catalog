import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAdminImpersonation } from '@/hooks/useAdminImpersonation';
import { Eye, X, AlertTriangle } from 'lucide-react';

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedStudent, stopImpersonation } = useAdminImpersonation();

  if (!isImpersonating || !impersonatedStudent) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>
            <strong>Visualizando como:</strong> {impersonatedStudent.nome} ({impersonatedStudent.email})
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={stopImpersonation}
          className="bg-orange-100 border-orange-300 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-800"
        >
          <X className="h-3 w-3 mr-1" />
          Voltar para Admin
        </Button>
      </AlertDescription>
    </Alert>
  );
}