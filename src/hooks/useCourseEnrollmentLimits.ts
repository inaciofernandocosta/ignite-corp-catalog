import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CourseEnrollmentStatus {
  totalEnrolled: number;
  limitReached: boolean;
  departmentLimitsReached: string[];
  canEnroll: boolean;
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
  });
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<{
    limite_alunos: number | null;
    limite_por_departamento: number | null;
  } | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const fetchEnrollmentStatus = async () => {
      try {
        setLoading(true);

        // Buscar dados do curso (limites)
        const { data: course, error: courseError } = await supabase
          .from('cursos')
          .select('limite_alunos, limite_por_departamento')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        setCourseData(course);

        // Buscar inscrições aprovadas no curso com join correto
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('inscricoes_cursos')
          .select(`
            id,
            aluno_id,
            status,
            inscricoes_mentoria!inner(
              id,
              departamento
            )
          `)
          .eq('curso_id', courseId)
          .in('status', ['aprovado', 'pendente']); // MUDANÇA: incluir pendentes também

        if (enrollmentError) {
          console.error('Erro ao buscar inscrições:', enrollmentError);
          throw enrollmentError;
        }

        const totalEnrolled = enrollments?.length || 0;
        console.log('Total de inscrições (aprovadas + pendentes):', totalEnrolled);

        // Contar por departamento
        const departmentCounts: { [key: string]: number } = {};
        enrollments?.forEach((enrollment: any) => {
          const dept = enrollment.inscricoes_mentoria?.departamento || 'Sem departamento';
          departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
        });

        console.log('Contagem por departamento:', departmentCounts);
        console.log('Limite por departamento:', course.limite_por_departamento);

        // Verificar limites por departamento
        const departmentLimitsReached: string[] = [];
        if (course.limite_por_departamento) {
          Object.entries(departmentCounts).forEach(([dept, count]) => {
            console.log(`Departamento ${dept}: ${count}/${course.limite_por_departamento}`);
            if (count >= course.limite_por_departamento!) {
              departmentLimitsReached.push(dept);
            }
          });
        }

        console.log('Departamentos com limite atingido:', departmentLimitsReached);

        // Verificar limite total
        const limitReached = course.limite_alunos ? totalEnrolled >= course.limite_alunos : false;

        // Determinar se pode inscrever novos alunos
        const canEnroll = !limitReached;

        setStatus({
          totalEnrolled,
          limitReached,
          departmentLimitsReached,
          canEnroll,
        });
      } catch (error) {
        console.error('Erro ao verificar limites do curso:', error);
      } finally {
        setLoading(false);
      }
    };

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
          fetchEnrollmentStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseId]);

  const checkDepartmentLimit = async (departamento: string): Promise<boolean> => {
    if (!courseData?.limite_por_departamento) return true;

    try {
      const { data: enrollments, error } = await supabase
        .from('inscricoes_cursos')
        .select(`
          id,
          aluno_id,
          status,
          inscricoes_mentoria!inner(
            id,
            departamento
          )
        `)
        .eq('curso_id', courseId)
        .in('status', ['aprovado', 'pendente']); // MUDANÇA: incluir pendentes também

      if (error) throw error;

      const departmentCount = enrollments?.filter(
        (e: any) => e.inscricoes_mentoria?.departamento === departamento
      ).length || 0;

      console.log(`CheckDepartmentLimit - Departamento ${departamento}: ${departmentCount}/${courseData.limite_por_departamento} (incluindo pendentes)`);

      return departmentCount < courseData.limite_por_departamento;
    } catch (error) {
      console.error('Erro ao verificar limite do departamento:', error);
      return false;
    }
  };

  return {
    status,
    loading,
    courseData,
    checkDepartmentLimit,
    refreshStatus: () => {
      if (courseId) {
        // Trigger refresh by updating a dependency
        setLoading(true);
      }
    },
  };
};