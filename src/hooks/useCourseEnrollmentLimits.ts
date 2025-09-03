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

        // Buscar inscrições no curso diretamente
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('inscricoes_cursos')
          .select(`
            id,
            aluno_id,
            status
          `)
          .eq('curso_id', courseId)
          .in('status', ['aprovado', 'pendente']);

        console.log('Inscrições encontradas para curso:', courseId, enrollments);

        if (enrollmentError) {
          console.error('Erro ao buscar inscrições:', enrollmentError);
          throw enrollmentError;
        }

        // Se há inscrições, buscar departamentos separadamente
        let enrollmentsWithDepartments = [];
        if (enrollments && enrollments.length > 0) {
          const alunoIds = enrollments.map(e => e.aluno_id);
          
          const { data: alunos, error: alunosError } = await supabase
            .from('inscricoes_mentoria')
            .select('id, departamento')
            .in('id', alunoIds);

          if (alunosError) {
            console.error('Erro ao buscar dados dos alunos:', alunosError);
            throw alunosError;
          }

          // Combinar dados
          enrollmentsWithDepartments = enrollments.map(enrollment => {
            const aluno = alunos?.find(a => a.id === enrollment.aluno_id);
            return {
              ...enrollment,
              departamento: aluno?.departamento || 'Sem departamento'
            };
          });
        }

        const totalEnrolled = enrollmentsWithDepartments?.length || 0;
        console.log('Total de inscrições (aprovadas + pendentes):', totalEnrolled);
        console.log('Inscrições com departamentos:', enrollmentsWithDepartments);

        // Contar por departamento
        const departmentCounts: { [key: string]: number } = {};
        enrollmentsWithDepartments?.forEach((enrollment: any) => {
          const dept = enrollment.departamento || 'Sem departamento';
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
      // Buscar inscrições no curso
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('inscricoes_cursos')
        .select('id, aluno_id, status')
        .eq('curso_id', courseId)
        .in('status', ['aprovado', 'pendente']);

      if (enrollmentError) throw enrollmentError;

      if (!enrollments || enrollments.length === 0) {
        console.log(`CheckDepartmentLimit - Departamento ${departamento}: 0/${courseData.limite_por_departamento} (incluindo pendentes)`);
        return true;
      }

      // Buscar departamentos dos alunos
      const alunoIds = enrollments.map(e => e.aluno_id);
      const { data: alunos, error: alunosError } = await supabase
        .from('inscricoes_mentoria')
        .select('id, departamento')
        .in('id', alunoIds);

      if (alunosError) throw alunosError;

      // Contar quantos do departamento específico
      const departmentCount = alunos?.filter(
        aluno => aluno.departamento === departamento
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