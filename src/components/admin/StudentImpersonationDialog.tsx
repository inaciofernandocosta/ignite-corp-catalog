import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAdminImpersonation } from '@/hooks/useAdminImpersonation';
import { Eye, Search, User, Building, Users } from 'lucide-react';

export function StudentImpersonationDialog() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { students, loading, fetchStudents, startImpersonation } = useAdminImpersonation();

  useEffect(() => {
    if (open && students.length === 0) {
      fetchStudents();
    }
  }, [open, students.length, fetchStudents]);

  const filteredStudents = students.filter(student =>
    student.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.empresa && student.empresa.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.departamento && student.departamento.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleImpersonate = (student: any) => {
    startImpersonation(student);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Visualizar como Aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Visualizar como Aluno
          </DialogTitle>
          <DialogDescription>
            Selecione um aluno para ver o sistema da perspectiva dele. Isso ajuda no suporte técnico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, empresa ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Students List */}
          <div className="flex-1 overflow-auto space-y-2">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhum aluno encontrado para esta busca.' : 'Nenhum aluno encontrado.'}
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => handleImpersonate(student)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-medium">{student.nome}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {student.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                      {(student.empresa || student.departamento) && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building className="w-3 h-3" />
                          <span>
                            {student.empresa}
                            {student.empresa && student.departamento && ' - '}
                            {student.departamento}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3 mr-1" />
                      Visualizar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}