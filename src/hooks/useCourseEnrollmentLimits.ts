import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CourseEnrollmentStatus {
  totalEnrolled: number;
  limitReached: boolean;
  departmentLimitsReached: string[];
  canEnroll: boolean;
  departmentCounts: { [key: string]: number };
}

interface DepartmentCount {
  departamento: string;
  count: number;
}

interface CourseEnrollmentCheckResult {
  totalEnrolled: number;
  limitReached: boolean;
  departmentLimitsReached: string[];
  canEnroll: boolean;
  departmentCounts: { [key: string]: number };
  courseData: {
    limite_alunos: number | null;
    limite_por_departamento: number | null;
  };
  error?: string;
}

export const useCourseEnrollmentLimits = (courseId: string) => {
  const [status, setStatus] = useState<CourseEnrollmentStatus>({
    totalEnrolled: 0,
    limitReached: false,
    departmentLimitsReached: [],
    canEnroll: true,
    departmentCounts: {},
  });
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<{
    limite_alunos: number | null;
    limite_por_departamento: number | null;
  } | null>(null);

  const fetchEnrollmentStatus = useCallback(async () => {
    if (!courseId) {
      console.log('❌ CourseId não fornecido');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Usando função segura para verificar limites do curso:', courseId);

      // Usar função segura para verificar limites (não depende de RLS)
      const { data: result, error } = await supabase.rpc('verificar_limites_curso', {
        p_curso_id: courseId
      });

      if (error) {
        console.error('❌ Erro ao chamar função de verificação:', error);
        throw error;
      }

      console.log('📋 Resultado da função de verificação:', result);

      // Cast do resultado para o tipo correto
      const courseResult = result as unknown as CourseEnrollmentCheckResult;

      if (courseResult.error) {
        console.error('❌ Erro retornado pela função:', courseResult.error);
        setStatus({
          totalEnrolled: 0,
          limitReached: false,
          departmentLimitsReached: [],
          canEnroll: false,
          departmentCounts: {},
        });
        setCourseData(null);
        return;
      }

      // Extrair dados do curso
      const courseInfo = courseResult.courseData;
      setCourseData({
        limite_alunos: courseInfo.limite_alunos,
        limite_por_departamento: courseInfo.limite_por_departamento
      });

      console.log('📊 Total de inscrições encontradas:', courseResult.totalEnrolled);
      console.log('🎯 Limite total atingido:', courseResult.limitReached);
      console.log('🏢 Departamentos com limite atingido:', courseResult.departmentLimitsReached);
      console.log('📈 Contagem por departamento:', courseResult.departmentCounts);

      // Atualizar status
      setStatus({
        totalEnrolled: courseResult.totalEnrolled,
        limitReached: courseResult.limitReached,
        departmentLimitsReached: courseResult.departmentLimitsReached || [],
        canEnroll: courseResult.canEnroll,
        departmentCounts: courseResult.departmentCounts || {},
      });

      console.log('✅ Status atualizado com sucesso');

    } catch (error) {
      console.error('💥 Erro ao verificar limites do curso:', error);
      // Em caso de erro, manter estado seguro
      setStatus({
        totalEnrolled: 0,
        limitReached: false,
        departmentLimitsReached: [],
        canEnroll: true,
        departmentCounts: {},
      });
      setCourseData(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchEnrollmentStatus();

    // Recarregar quando houver mudanças nas inscrições
    const channel = supabase
      .channel('course-enrollments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inscricoes_cursos',
          filter: `curso_id=eq.${courseId}`,
        },
        () => {
          console.log('🔄 Mudança detectada nas inscrições, recarregando...');
          fetchEnrollmentStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEnrollmentStatus]);

  const checkDepartmentLimit = useCallback(async (departamento: string): Promise<boolean> => {
    console.log(`🔍 Verificação rápida do departamento: ${departamento}`);
    
    if (!courseData?.limite_por_departamento) {
      console.log(`✅ Sem limite por departamento configurado`);
      return true;
    }

    // Usar dados já carregados se disponível
    if (status.departmentCounts[departamento]) {
      const count = status.departmentCounts[departamento];
      const canEnroll = count < courseData.limite_por_departamento;
      console.log(`📊 Usando dados em cache: ${departamento} ${count}/${courseData.limite_por_departamento} - Can enroll: ${canEnroll}`);
      return canEnroll;
    }

    console.log(`⚠️ Dados não encontrados em cache para ${departamento}, fazendo consulta direta`);
    return true; // Se não tiver dados em cache, permite por enquanto
  }, [courseData, status.departmentCounts]);

  return {
    status,
    loading,
    courseData,
    checkDepartmentLimit,
    refreshStatus: fetchEnrollmentStatus,
  };
};