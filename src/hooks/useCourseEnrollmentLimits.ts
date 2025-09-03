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
      console.log('🔄 Iniciando verificação de limites para curso:', courseId);

      // 1. Buscar dados do curso (limites configurados)
      const { data: course, error: courseError } = await supabase
        .from('cursos')
        .select('limite_alunos, limite_por_departamento')
        .eq('id', courseId)
        .single();

      if (courseError) {
        console.error('❌ Erro ao buscar dados do curso:', courseError);
        throw courseError;
      }
      
      setCourseData(course);
      console.log('📋 Dados do curso encontrados:', course);

      // 2. Buscar todas as inscrições no curso (aprovadas + pendentes)
      console.log('🔍 Buscando inscrições para curso:', courseId);
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('inscricoes_cursos')
        .select('id, aluno_id, status')
        .eq('curso_id', courseId)
        .in('status', ['aprovado', 'pendente']);

      if (enrollmentError) {
        console.error('❌ Erro ao buscar inscrições:', enrollmentError);
        throw enrollmentError;
      }

      console.log('📊 Inscrições encontradas:', enrollments);
      const totalEnrolled = enrollments?.length || 0;
      console.log('📊 Total de inscrições (aprovadas + pendentes):', totalEnrolled);

      // 3. VERIFICAÇÃO HIERÁRQUICA - Primeiro: Limite total do curso
      let courseLimitReached = false;
      if (course.limite_alunos && totalEnrolled >= course.limite_alunos) {
        courseLimitReached = true;
        console.log('🚫 LIMITE TOTAL DO CURSO ATINGIDO:', totalEnrolled, '>=', course.limite_alunos);
        
        // Se limite total atingido, não precisa verificar departamentos
        setStatus({
          totalEnrolled,
          limitReached: true,
          departmentLimitsReached: [],
          canEnroll: false,
          departmentCounts: {},
        });
        
        return;
      }

      console.log('✅ Curso tem vagas disponíveis no total:', totalEnrolled, '/', course.limite_alunos || 'ilimitado');

      // 4. VERIFICAÇÃO HIERÁRQUICA - Segundo: Limites por departamento
      let departmentLimitsReached: string[] = [];
      const departmentCounts: { [key: string]: number } = {};

      if (course.limite_por_departamento && enrollments && enrollments.length > 0) {
        console.log('🏢 Verificando limites por departamento...');

        // Buscar departamentos dos alunos inscritos
        const alunoIds = enrollments.map(e => e.aluno_id);
        console.log('👥 IDs dos alunos para buscar departamentos:', alunoIds);
        
        const { data: alunos, error: alunosError } = await supabase
          .from('inscricoes_mentoria')
          .select('id, departamento')
          .in('id', alunoIds);

        if (alunosError) {
          console.error('❌ Erro ao buscar dados dos alunos:', alunosError);
          throw alunosError;
        }

        console.log('👥 Dados dos alunos encontrados:', alunos);

        // Contar inscrições por departamento
        alunos?.forEach((aluno) => {
          const dept = aluno.departamento || 'Sem departamento';
          departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
        });

        console.log('📈 Contagem por departamento:', departmentCounts);

        // Verificar quais departamentos atingiram o limite
        Object.entries(departmentCounts).forEach(([dept, count]) => {
          console.log(`📈 Departamento ${dept}: ${count}/${course.limite_por_departamento}`);
          if (count >= course.limite_por_departamento!) {
            departmentLimitsReached.push(dept);
            console.log(`🚫 Departamento ${dept} atingiu o limite!`);
          }
        });
      } else {
        console.log('✅ Sem limite por departamento ou sem inscrições');
      }

      // 5. Resultado final
      console.log('📋 RESULTADO FINAL:', {
        totalEnrolled,
        courseLimitReached,
        departmentLimitsReached,
        canEnroll: !courseLimitReached
      });

      setStatus({
        totalEnrolled,
        limitReached: courseLimitReached,
        departmentLimitsReached,
        canEnroll: !courseLimitReached,
        departmentCounts,
      });

    } catch (error) {
      console.error('💥 Erro ao verificar limites do curso:', error);
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