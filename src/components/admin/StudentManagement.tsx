import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminStats } from './AdminStats';
import { StudentCard } from './StudentCard';
import { Search, UserPlus, Filter } from 'lucide-react';

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

export const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStatsData>({
    totalStudents: 0,
    activeCourses: 0,
    totalCertificates: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const { toast } = useToast();

  useEffect(() => {
    fetchStudentsAndStats();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter]);

  const fetchStudentsAndStats = async () => {
    try {
      setLoading(true);

      // Buscar alunos
      const { data: studentsData, error: studentsError } = await supabase
        .from('inscricoes_mentoria')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      setStudents(studentsData || []);

      // Buscar estatísticas
      const { data: coursesData, error: coursesError } = await supabase
        .from('cursos')
        .select('id')
        .eq('status', 'active');

      const { data: certificatesData, error: certificatesError } = await supabase
        .from('certificados_conclusao')
        .select('id');

      if (coursesError) console.error('Erro ao buscar cursos:', coursesError);
      if (certificatesError) console.error('Erro ao buscar certificados:', certificatesError);

      const activeStudents = studentsData?.filter(s => s.ativo && s.status === 'ativo') || [];

      setAdminStats({
        totalStudents: activeStudents.length,
        activeCourses: coursesData?.length || 0,
        totalCertificates: certificatesData?.length || 0
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
  };

  const filterStudents = () => {
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

    setFilteredStudents(filtered);
  };

  const handleStudentUpdate = () => {
    fetchStudentsAndStats();
  };

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
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                Gerenciar Inscrições ({filteredStudents.length})
              </CardTitle>
            </div>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Cadastrar Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
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
    </div>
  );
};