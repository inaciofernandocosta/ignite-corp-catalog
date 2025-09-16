import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StudentForImpersonation {
  id: string;
  nome: string;
  email: string;
  empresa?: string;
  departamento?: string;
  status: string;
}

export const useAdminImpersonation = () => {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedStudent, setImpersonatedStudent] = useState<StudentForImpersonation | null>(null);
  const [students, setStudents] = useState<StudentForImpersonation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check if currently impersonating from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('admin_impersonation');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setImpersonatedStudent(data);
        setIsImpersonating(true);
      } catch (error) {
        console.error('Error parsing impersonation data:', error);
        localStorage.removeItem('admin_impersonation');
      }
    }
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inscricoes_mentoria')
        .select('id, nome, email, empresa, departamento, status')
        .eq('ativo', true)
        .eq('status', 'aprovado')
        .order('nome');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de alunos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startImpersonation = (student: StudentForImpersonation) => {
    setImpersonatedStudent(student);
    setIsImpersonating(true);
    localStorage.setItem('admin_impersonation', JSON.stringify(student));
    
    toast({
      title: "Visualizando como aluno",
      description: `Agora você está vendo o sistema como ${student.nome}`,
    });
  };

  const stopImpersonation = () => {
    setImpersonatedStudent(null);
    setIsImpersonating(false);
    localStorage.removeItem('admin_impersonation');
    
    toast({
      title: "Voltou para visão de admin",
      description: "Você voltou para a sua conta de administrador.",
    });
  };

  return {
    isImpersonating,
    impersonatedStudent,
    students,
    loading,
    fetchStudents,
    startImpersonation,
    stopImpersonation,
  };
};