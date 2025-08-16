import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Immersion } from '@/data/mockData';

export const useCourses = () => {
  const [courses, setCourses] = useState<Immersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('cursos')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Map database courses to Immersion interface
        const mappedCourses: Immersion[] = (data || []).map(course => ({
          id: course.id,
          title: course.titulo,
          tags: course.objetivos?.slice(0, 3) || ['IA Aplicada'], // Use objectives as tags, fallback to default
          level: mapLevel(course.nivel),
          workloadDays: parseDuration(course.duracao),
          nextClass: getNextClassDate(), // Generate next class date
          badges: getBadges(course),
          description: course.descricao || 'Domine estratégias práticas e aplicáveis com metodologia exclusiva dos especialistas da indústria.',
          image: course.imagem_capa,
          duration: course.duracao,
          startDate: course.data_inicio
        }));

        setCourses(mappedCourses);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar cursos');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return { courses, loading, error };
};

// Helper functions
const mapLevel = (nivel: string): 'intro' | 'intermediate' | 'advanced' => {
  switch (nivel?.toLowerCase()) {
    case 'básico':
    case 'basico':
    case 'iniciante':
      return 'intro';
    case 'intermediário':
    case 'intermediario':
      return 'intermediate';
    case 'avançado':
    case 'avancado':
      return 'advanced';
    default:
      return 'intermediate';
  }
};

const parseDuration = (duracao: string): number => {
  if (!duracao) return 1;
  
  // Extract number from duration string (e.g., "2 dias", "1 semana")
  const match = duracao.match(/(\d+)/);
  if (match) {
    const number = parseInt(match[1]);
    if (duracao.toLowerCase().includes('semana')) {
      return number * 5; // Convert weeks to days
    }
    return number;
  }
  
  return 1;
};

const getNextClassDate = (): string => {
  // Generate next class date (15-30 days from now)
  const today = new Date();
  const daysToAdd = Math.floor(Math.random() * 16) + 15; // Random between 15-30 days
  const nextClass = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return nextClass.toISOString().split('T')[0];
};

const getBadges = (course: any): ('new' | 'popular')[] => {
  const badges: ('new' | 'popular')[] = [];
  
  // Mark as new if created within last 30 days
  const createdAt = new Date(course.created_at);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  if (createdAt > thirtyDaysAgo) {
    badges.push('new');
  }
  
  // Add popular badge randomly for some courses (simulating popularity)
  if (Math.random() > 0.7) {
    badges.push('popular');
  }
  
  return badges;
};