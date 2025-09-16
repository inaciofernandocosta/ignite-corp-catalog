import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Award, Calendar, User, BookOpen, Eye, Download, RefreshCw } from 'lucide-react';
import { StorageCertificateViewer } from '@/components/StorageCertificateViewer';
import * as XLSX from 'xlsx';

interface CertificateWithDetails {
  id: string;
  inscricao_curso_id: string;
  numero_certificado: string; 
  data_conclusao: string;
  data_emissao: string;
  aprovado_por?: string;
  status: string;
  observacoes?: string;
  certificado_pdf?: string;
  // Dados relacionados
  aluno_nome: string;
  aluno_email: string;
  curso_titulo: string;
  empresa?: string;
  departamento?: string;
}

export function CertificateManagement() {
  const [certificates, setCertificates] = useState<CertificateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateWithDetails | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const { toast } = useToast();

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('certificados_conclusao')
        .select(`
          *,
          inscricoes_cursos!inner (
            aluno_id,
            curso_id,
            cursos (
              titulo
            ),
            inscricoes_mentoria (
              nome,
              email,
              empresa,
              departamento
            )
          )
        `)
        .order('data_emissao', { ascending: false });

      if (error) throw error;

      // Mapear os dados para formato mais fácil de usar
      const mappedCertificates = (data || []).map((cert: any) => ({
        id: cert.id,
        inscricao_curso_id: cert.inscricao_curso_id,
        numero_certificado: cert.numero_certificado,
        data_conclusao: cert.data_conclusao,
        data_emissao: cert.data_emissao,
        aprovado_por: cert.aprovado_por,
        status: cert.status,
        observacoes: cert.observacoes,
        certificado_pdf: cert.certificado_pdf,
        aluno_nome: cert.inscricoes_cursos?.inscricoes_mentoria?.nome || 'Nome não informado',
        aluno_email: cert.inscricoes_cursos?.inscricoes_mentoria?.email || 'Email não informado',
        curso_titulo: cert.inscricoes_cursos?.cursos?.titulo || 'Curso não informado',
        empresa: cert.inscricoes_cursos?.inscricoes_mentoria?.empresa,
        departamento: cert.inscricoes_cursos?.inscricoes_mentoria?.departamento,
      }));

      setCertificates(mappedCertificates);
    } catch (error) {
      console.error('Erro ao buscar certificados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os certificados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      aprovado: { variant: "default" as const, label: "Aprovado" },
      pendente: { variant: "secondary" as const, label: "Pendente" },
      cancelado: { variant: "destructive" as const, label: "Cancelado" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      label: status
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewCertificate = (certificate: CertificateWithDetails) => {
    // Adaptar formato para o StorageCertificateViewer
    const certForViewer = {
      id: certificate.id,
      inscricao_curso_id: certificate.inscricao_curso_id,
      numero_certificado: certificate.numero_certificado,
      data_conclusao: certificate.data_conclusao,
      data_emissao: certificate.data_emissao,
      aprovado_por: certificate.aprovado_por,
      status: certificate.status,
      observacoes: certificate.observacoes,
      certificado_pdf: certificate.certificado_pdf,
      aluno_nome: certificate.aluno_nome
    };

    setSelectedCertificate(certificate);
  };

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Dados formatados para o Excel
      const excelData = certificates.map((cert, index) => ({
        'Nº': index + 1,
        'Número do Certificado': cert.numero_certificado,
        'Nome do Aluno': cert.aluno_nome,
        'E-mail': cert.aluno_email,
        'Curso': cert.curso_titulo,
        'Empresa': cert.empresa || '',
        'Departamento': cert.departamento || '',
        'Data de Conclusão': new Date(cert.data_conclusao).toLocaleDateString('pt-BR'),
        'Data de Emissão': new Date(cert.data_emissao).toLocaleDateString('pt-BR'),
        'Aprovado Por': cert.aprovado_por || '',
        'Status': cert.status.charAt(0).toUpperCase() + cert.status.slice(1),
        'Observações': cert.observacoes || ''
      }));

      // Criar planilha
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Configurar largura das colunas
      const columnWidths = [
        { wch: 5 },   // Nº
        { wch: 20 },  // Número do Certificado
        { wch: 25 },  // Nome do Aluno
        { wch: 30 },  // E-mail
        { wch: 30 },  // Curso
        { wch: 25 },  // Empresa
        { wch: 20 },  // Departamento
        { wch: 15 },  // Data de Conclusão
        { wch: 15 },  // Data de Emissão
        { wch: 25 },  // Aprovado Por
        { wch: 12 },  // Status
        { wch: 30 }   // Observações
      ];
      worksheet['!cols'] = columnWidths;

      // Adicionar a planilha ao workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificados');

      // Criar nome do arquivo com data atual
      const currentDate = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
      const fileName = `certificados_${currentDate}.xlsx`;

      // Exportar o arquivo
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Exportação concluída!",
        description: `Arquivo ${fileName} foi baixado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados para Excel.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Gerenciar Certificados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Gerenciar Certificados ({certificates.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={exportToExcel}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar Excel
              </Button>
              <Button
                onClick={fetchCertificates}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {certificates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum certificado encontrado.
              </p>
            ) : (
              certificates.map((certificate) => (
                <div
                  key={certificate.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{certificate.numero_certificado}</h3>
                        {getStatusBadge(certificate.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{certificate.aluno_nome}</span>
                        <span>({certificate.aluno_email})</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="w-4 h-4" />
                        <span>{certificate.curso_titulo}</span>
                      </div>
                      {certificate.empresa && (
                        <p className="text-sm text-muted-foreground">
                          {certificate.empresa}
                          {certificate.departamento && ` - ${certificate.departamento}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCertificate(certificate)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Certificado
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Data de Conclusão:</span>
                      <p className="font-medium">
                        {new Date(certificate.data_conclusao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Data de Emissão:</span>
                      <p className="font-medium">
                        {new Date(certificate.data_emissao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Aprovado Por:</span>
                      <p className="font-medium">{certificate.aprovado_por || 'Sistema'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <p className="font-medium">{certificate.status}</p>
                    </div>
                  </div>

                  {certificate.observacoes && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-muted-foreground text-sm">Observações:</span>
                      <p className="text-sm">{certificate.observacoes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCertificate && (
        <StorageCertificateViewer 
          certificate={{
            id: selectedCertificate.id,
            inscricao_curso_id: selectedCertificate.inscricao_curso_id,
            numero_certificado: selectedCertificate.numero_certificado,
            data_conclusao: selectedCertificate.data_conclusao,
            data_emissao: selectedCertificate.data_emissao,
            aprovado_por: selectedCertificate.aprovado_por,
            status: selectedCertificate.status,
            observacoes: selectedCertificate.observacoes,
            certificado_pdf: selectedCertificate.certificado_pdf,
            aluno_nome: selectedCertificate.aluno_nome
          }}
        />
      )}
    </>
  );
}