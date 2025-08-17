import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Course {
  id: string;
  titulo: string;
  descricao: string;
  duracao: string;
  nivel: string;
  status: string;
  imagem_capa?: string;
  objetivos?: string[];
  pre_requisitos?: string[];
  certificacao?: boolean;
  preco?: number;
  created_at: string;
  updated_at: string;
  data_inicio?: string;
  data_fim?: string;
  slug?: string;
}

// Generate slug from title
export const generateSlug = (title: string): string => {
  return title.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
};

export const useCourseDetails = (slug: string) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verificar se slug é válido
        if (!slug || slug === 'undefined') {
          setError('Curso não encontrado');
          setLoading(false);
          return;
        }

        // First try to find by slug
        let { data, error } = await supabase
          .from('cursos')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'active')
          .single();

        // If not found by slug, try to find by generated slug from title
        if (error && error.code === 'PGRST116') {
          const { data: allCourses, error: allError } = await supabase
            .from('cursos')
            .select('*')
            .eq('status', 'active');

          if (allError) throw allError;

          // Find course where generated slug matches
          const foundCourse = allCourses?.find(course => 
            generateSlug(course.titulo) === slug
          );

          if (foundCourse) {
            data = foundCourse;
            error = null;
          }
        }

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setCourse(data);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar curso');
      } finally {
        setLoading(false);
      }
    };

    if (slug && slug !== 'undefined') {
      fetchCourse();
    } else {
      setLoading(false);
      setError('Curso não encontrado');
    }
  }, [slug]);

  return { course, loading, error };
};