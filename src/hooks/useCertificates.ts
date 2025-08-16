import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Certificate {
  id: string;
  inscricao_curso_id: string;
  numero_certificado: string;
  data_conclusao: string;
  data_emissao: string;
  aprovado_por?: string;
  status: string;
  observacoes?: string;
  certificado_pdf: string | null;
  aluno_nome?: string;
}

export const useCertificates = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('certificados_conclusao')
        .select('*');
      
      if (error) throw error;
      setCertificates(data || []);
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

  const saveCertificatePDF = async (certificateId: string, pdfDataUrl: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('certificados_conclusao')
        .update({ certificado_pdf: pdfDataUrl })
        .eq('id', certificateId);

      if (error) throw error;
      
      // Atualizar o estado local
      setCertificates(prev => 
        prev.map(cert => 
          cert.id === certificateId 
            ? { ...cert, certificado_pdf: pdfDataUrl }
            : cert
        )
      );

      return true;
    } catch (error) {
      console.error('Erro ao salvar certificado PDF:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  return {
    certificates,
    loading,
    fetchCertificates,
    saveCertificatePDF
  };
};