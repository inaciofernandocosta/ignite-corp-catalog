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

      // Usar a função segura do banco que bypassa RLS
      const { data: result, error } = await supabase.rpc('verificar_limites_curso', {
        p_curso_id: courseId
      });

      if (error) {
        console.error('❌ Erro ao chamar função de limites:', error);
        throw error;
      }

      console.log('📊 Resultado da função segura:', result);

      // Fazer cast do resultado para o tipo correto
      const limitsResult = result as any;

      // Verificar se houve erro na função
      if (limitsResult?.error) {
        console.error('❌ Erro retornado pela função:', limitsResult.error);
        setStatus({
          totalEnrolled: 0,
          limitReached: false,
          departmentLimitsReached: [],
          canEnroll: false,
          departmentCounts: {},
        });
        return;
      }

      // Extrair dados do curso
      if (limitsResult?.courseData) {
        setCourseData({
          limite_alunos: limitsResult.courseData.limite_alunos,
          limite_por_departamento: limitsResult.courseData.limite_por_departamento
        });
        console.log('📋 Dados do curso configurados:', limitsResult.courseData);
      }

      // Configurar status com base no resultado
      const newStatus: CourseEnrollmentStatus = {
        totalEnrolled: limitsResult?.totalEnrolled || 0,
        limitReached: limitsResult?.limitReached || false,
        departmentLimitsReached: limitsResult?.departmentLimitsReached || [],
        canEnroll: limitsResult?.canEnroll !== false, // Default true se não especificado
        departmentCounts: limitsResult?.departmentCounts || {},
      };

      console.log('✅ Status configurado:', newStatus);

      // Logs detalhados para debug
      console.log('📊 RESUMO DOS LIMITES:');
      console.log(`   📈 Total inscrições: ${newStatus.totalEnrolled}`);
      console.log(`   🎯 Limite do curso: ${limitsResult?.courseData?.limite_alunos || 'ilimitado'}`);
      console.log(`   🚫 Curso esgotado: ${newStatus.limitReached ? 'SIM' : 'NÃO'}`);
      console.log(`   🏢 Limite por depto: ${limitsResult?.courseData?.limite_por_departamento || 'sem limite'}`);
      
      if (newStatus.departmentLimitsReached.length > 0) {
        console.log(`   🚫 Departamentos esgotados: ${newStatus.departmentLimitsReached.join(', ')}`);
      }
      
      if (Object.keys(newStatus.departmentCounts).length > 0) {
        console.log('   📊 Contagem por departamento:');
        Object.entries(newStatus.departmentCounts).forEach(([dept, count]) => {
          console.log(`      - ${dept}: ${count}`);
        });
      }

      setStatus(newStatus);

    } catch (error) {
      console.error('💥 Erro ao verificar limites do curso:', error);
      setStatus({
        totalEnrolled: 0,
        limitReached: false,
        departmentLimitsReached: [],
        canEnroll: false,
        departmentCounts: {},
      });
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
    if (status.departmentCounts[departamento] !== undefined) {
      const count = status.departmentCounts[departamento];
      const canEnroll = count < courseData.limite_por_departamento;
      console.log(`📊 Usando dados em cache: ${departamento} ${count}/${courseData.limite_por_departamento} - Can enroll: ${canEnroll}`);
      return canEnroll;
    }

    // Se não há dados em cache, verificar se departamento está na lista de bloqueados
    const isBlocked = status.departmentLimitsReached.includes(departamento);
    console.log(`📊 Departamento ${departamento} ${isBlocked ? 'BLOQUEADO' : 'LIBERADO'} (sem contagem específica)`);
    return !isBlocked;
  }, [courseData, status.departmentCounts, status.departmentLimitsReached]);

  return {
    status,
    loading,
    courseData,
    checkDepartmentLimit,
    refreshStatus: fetchEnrollmentStatus,
  };
};