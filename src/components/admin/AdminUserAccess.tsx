import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Users, 
  Activity, 
  UserX, 
  Calendar, 
  Download,
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface UserAccessData {
  id: string;
  nome: string;
  email: string;
  empresa: string;
  departamento: string;
  status: string;
  ativo: boolean;
  data_inscricao: string;
  total_acessos: number;
  ultimo_acesso: string | null;
  primeiro_acesso: string | null;
  status_acesso: string;
}

interface AccessStats {
  totalUsers: number;
  neverAccessed: number;
  activeUsers: number;
  inactiveUsers: number;
}

export const AdminUserAccess = React.memo(() => {
  const [users, setUsers] = useState<UserAccessData[]>([]);
  const [stats, setStats] = useState<AccessStats>({
    totalUsers: 0,
    neverAccessed: 0,
    activeUsers: 0,
    inactiveUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const { toast } = useToast();

  // Filtrar usuários
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.nome?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.empresa?.toLowerCase().includes(term) ||
        user.departamento?.toLowerCase().includes(term)
      );
    }

    // Filtrar por status de acesso
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(user => user.status_acesso === statusFilter);
    }

    return filtered;
  }, [users, searchTerm, statusFilter]);

  const fetchUserAccessData = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_access_stats')
        .select('*');

      if (error) throw error;

      setUsers(data || []);

      // Calcular estatísticas
      const totalUsers = data?.length || 0;
      const neverAccessed = data?.filter(u => u.status_acesso === 'Nunca acessou').length || 0;
      const activeUsers = data?.filter(u => u.status_acesso === 'Ativo').length || 0;
      const inactiveUsers = data?.filter(u => 
        u.status_acesso === 'Inativo (30+ dias)' || u.status_acesso === 'Pouco ativo (7+ dias)'
      ).length || 0;

      setStats({
        totalUsers,
        neverAccessed,
        activeUsers,
        inactiveUsers
      });

    } catch (error: any) {
      console.error('Erro ao buscar dados de acesso:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de acesso dos usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUserAccessData();
  }, [fetchUserAccessData]);

  const exportAccessData = useCallback(() => {
    try {
      const dataToExport = filteredUsers.map(user => ({
        'Nome': user.nome,
        'Email': user.email,
        'Empresa': user.empresa || 'N/A',
        'Departamento': user.departamento || 'N/A',
        'Status de Acesso': user.status_acesso,
        'Total de Acessos': user.total_acessos,
        'Último Acesso': user.ultimo_acesso 
          ? new Date(user.ultimo_acesso).toLocaleDateString('pt-BR')
          : 'Nunca acessou',
        'Primeiro Acesso': user.primeiro_acesso 
          ? new Date(user.primeiro_acesso).toLocaleDateString('pt-BR')
          : 'N/A',
        'Data de Inscrição': new Date(user.data_inscricao).toLocaleDateString('pt-BR')
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Acessos dos Usuários');

      // Definir larguras das colunas
      const colWidths = [
        { wch: 25 }, // Nome
        { wch: 30 }, // Email
        { wch: 20 }, // Empresa
        { wch: 20 }, // Departamento
        { wch: 18 }, // Status de Acesso
        { wch: 15 }, // Total de Acessos
        { wch: 15 }, // Último Acesso
        { wch: 15 }, // Primeiro Acesso
        { wch: 15 }  // Data de Inscrição
      ];
      ws['!cols'] = colWidths;

      // Nome do arquivo com filtros aplicados
      let fileName = 'relatorio-acessos-usuarios';
      if (statusFilter !== 'todos') {
        fileName += `-${statusFilter.replace(/\s+/g, '-').toLowerCase()}`;
      }
      if (searchTerm.trim()) {
        fileName += `-busca`;
      }
      fileName += '.xlsx';

      XLSX.writeFile(wb, fileName);

      toast({
        title: "Sucesso",
        description: `Relatório exportado com ${filteredUsers.length} usuários.`,
      });
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar relatório.",
        variant: "destructive",
      });
    }
  }, [filteredUsers, statusFilter, searchTerm, toast]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'default';
      case 'Nunca acessou':
        return 'destructive';
      case 'Inativo (30+ dias)':
        return 'secondary';
      case 'Pouco ativo (7+ dias)':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Acessos dos Usuários</h2>
        <p className="text-muted-foreground">Monitore a atividade e engajamento dos usuários na plataforma</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
            </div>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserX className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-muted-foreground">Nunca Acessaram</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.neverAccessed}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <p className="text-sm font-medium text-muted-foreground">Usuários Inativos</p>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.inactiveUsers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>
              Relatório de Acessos ({filteredUsers.length} usuários)
            </CardTitle>
            <Button onClick={exportAccessData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os usuários</SelectItem>
                  <SelectItem value="Ativo">Usuários ativos</SelectItem>
                  <SelectItem value="Nunca acessou">Nunca acessaram</SelectItem>
                  <SelectItem value="Pouco ativo (7+ dias)">Pouco ativos</SelectItem>
                  <SelectItem value="Inativo (30+ dias)">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de usuários */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm.trim() || statusFilter !== 'todos' 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Não há usuários cadastrados ainda.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{user.nome}</h4>
                          {user.status_acesso !== 'Nunca acessou' && (
                            <Badge variant={getStatusBadgeVariant(user.status_acesso)} className="text-xs">
                              {user.status_acesso}
                            </Badge>
                          )}
                        </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                        {user.empresa && (
                          <span>Empresa: {user.empresa}</span>
                        )}
                        {user.departamento && (
                          <span>Depto: {user.departamento}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">{user.total_acessos} acessos</div>
                      <div className="text-muted-foreground">
                        {user.ultimo_acesso ? (
                          <>
                            Último: {formatDistanceToNow(new Date(user.ultimo_acesso), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </>
                        ) : (
                          'Nunca acessou'
                        )}
                      </div>
                      {user.primeiro_acesso && (
                        <div className="text-muted-foreground text-xs">
                          Primeiro: {formatDistanceToNow(new Date(user.primeiro_acesso), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

AdminUserAccess.displayName = 'AdminUserAccess';