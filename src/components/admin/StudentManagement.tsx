import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminStats } from './AdminStats';
import { StudentCard } from './StudentCard';
import { CreateUserDialog } from './CreateUserDialog';
import AuthManagementDialog from './AuthManagementDialog';
import { Search, UserPlus, Filter, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

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

interface AdminStatsData {
  totalStudents: number;
  activeCourses: number;
  totalCertificates: number;
}

export const StudentManagement = React.memo(() => {
  const [students, setStudents] = useState<Student[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStatsData>({
    totalStudents: 0,
    activeCourses: 0,
    totalCertificates: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  // Memorizar students filtrados para evitar re-cálculos desnecessários
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        student.nome.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term) ||
        student.empresa?.toLowerCase().includes(term) ||
        student.departamento?.toLowerCase().includes(term) ||
        student.cargo?.toLowerCase().includes(term)
      );
    }

    // Filtrar por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    return filtered;
  }, [students, searchTerm, statusFilter]);

  const fetchStudentsAndStats = useCallback(async () => {
    try {
      setLoading(true);

      // Buscar alunos
      const { data: studentsData, error: studentsError } = await supabase
        .from('inscricoes_mentoria')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      setStudents(studentsData || []);

      // Buscar estatísticas apenas se necessário - usando Promise.all para melhor performance
      const [coursesResponse, certificatesResponse] = await Promise.all([
        supabase.from('cursos').select('id').eq('status', 'active'),
        supabase.from('certificados_conclusao').select('id')
      ]);

      const activeStudents = studentsData?.filter(s => s.ativo && s.status === 'aprovado') || [];

      setAdminStats({
        totalStudents: activeStudents.length,
        activeCourses: coursesResponse.data?.length || 0,
        totalCertificates: certificatesResponse.data?.length || 0
      });

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as informações dos alunos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await fetchStudentsAndStats();
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchStudentsAndStats]);

  const handleStudentUpdate = useCallback(() => {
    fetchStudentsAndStats();
  }, [fetchStudentsAndStats]);

  const exportStudents = useCallback(() => {
    if (filteredStudents.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Não há alunos nos filtros atuais para exportar.',
        variant: 'destructive',
      });
      return;
    }

    // Preparar dados para Excel
    const excelData = filteredStudents.map(student => ({
      'Nome': student.nome || '',
      'E-mail': student.email || '',
      'Telefone': student.telefone || '',
      'Empresa': student.empresa || '',
      'Departamento': student.departamento || '',
      'Cargo': student.cargo || '',
      'Unidade': student.unidade || '',
      'Status': student.status || '',
      'Situação': student.ativo ? 'Ativo' : 'Inativo',
      'Data de Cadastro': new Date(student.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      })
    }));

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Definir larguras das colunas
    const columnWidths = [
      { wch: 25 }, // Nome
      { wch: 30 }, // E-mail
      { wch: 15 }, // Telefone
      { wch: 20 }, // Empresa
      { wch: 20 }, // Departamento
      { wch: 25 }, // Cargo
      { wch: 20 }, // Unidade
      { wch: 12 }, // Status
      { wch: 10 }, // Situação
      { wch: 15 }  // Data de Cadastro
    ];
    worksheet['!cols'] = columnWidths;

    // Aplicar estilos aos cabeçalhos
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1e40af' } }, // Azul profissional
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };
    }

    // Aplicar bordas às células de dados
    for (let row = 1; row <= headerRange.e.r; row++) {
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellAddress]) continue;
        
        worksheet[cellAddress].s = {
          border: {
            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
            right: { style: 'thin', color: { rgb: 'CCCCCC' } }
          },
          alignment: { vertical: 'center' }
        };
      }
    }

    // Adicionar informações de contexto na planilha
    let sheetName = 'Alunos';
    if (searchTerm.trim() || statusFilter !== 'todos') {
      const filters = [];
      if (searchTerm.trim()) filters.push(`Busca: ${searchTerm.trim()}`);
      if (statusFilter !== 'todos') filters.push(`Status: ${statusFilter}`);
      sheetName = `Alunos (${filters.join(', ')})`;
    }

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Nome do arquivo
    const currentDate = new Date().toISOString().split('T')[0];
    let fileName = `Relatorio_Alunos_${currentDate}`;
    
    if (searchTerm.trim()) {
      fileName += `_${searchTerm.trim().replace(/\s+/g, '_')}`;
    }
    
    if (statusFilter !== 'todos') {
      fileName += `_${statusFilter}`;
    }

    // Salvar arquivo
    XLSX.writeFile(workbook, `${fileName}.xlsx`);

    toast({
      title: 'Exportação concluída',
      description: `${filteredStudents.length} alunos exportados em Excel com sucesso.`,
    });
  }, [filteredStudents, searchTerm, statusFilter, toast]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <AdminStats
        totalStudents={adminStats.totalStudents}
        activeCourses={adminStats.activeCourses}
        totalCertificates={adminStats.totalCertificates}
      />

      {/* Gerenciar Inscrições */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <CardTitle className="text-lg sm:text-xl">
                Gerenciar Inscrições ({filteredStudents.length})
              </CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <AuthManagementDialog />
              <Button
                variant="outline"
                onClick={exportStudents}
                disabled={filteredStudents.length === 0}
                className="text-xs sm:text-sm"
                size="sm"
              >
                <Download className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
                Exportar ({filteredStudents.length})
              </Button>
              <Button onClick={() => setShowCreateDialog(true)} className="text-xs sm:text-sm" size="sm">
                <UserPlus className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
                Cadastrar Usuário
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {/* Filtros */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-3 sm:h-4 w-3 sm:w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Alunos */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum aluno encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'todos' 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Ainda não há alunos cadastrados no sistema.'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredStudents.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onStudentUpdate={handleStudentUpdate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onUserCreated={handleStudentUpdate}
      />
    </div>
  );
});