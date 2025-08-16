import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Banner {
  id: string;
  message: string;
  course_slug: string;
  background_color: string;
  text_color: string;
  border_color: string;
  icon: string;
  is_active: boolean;
  data_imersao: string | null;
  daysUntilStart?: number;
  formattedDate?: string;
}

interface Stats {
  certificatesCount: number;
  companiesCount: number;
}

interface ActiveBanner {
  message: string;
  icon: string;
  daysUntilStart: number;
  formattedDate: string;
}

export function useStats() {
  const [stats, setStats] = useState<Stats>({ certificatesCount: 0, companiesCount: 0 });
  const [activeBanner, setActiveBanner] = useState<ActiveBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Buscar quantidade de certificados emitidos
        const { count: certificatesCount, error: certsError } = await supabase
          .from('certificados_conclusao')
          .select('*', { count: 'exact', head: true });

        if (certsError) {
          console.error('Erro ao buscar certificados:', certsError);
          throw certsError;
        }

        // Buscar banner ativo
        const { data: bannerData, error: bannerError } = await supabase
          .from('course_banners')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (bannerError && bannerError.code !== 'PGRST116') {
          console.error('Erro ao buscar banner:', bannerError);
        }

        const formatDate = (dateString: string | null) => {
          if (!dateString) return '03 DE SET.';
          const date = new Date(dateString);
          return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
          }).toUpperCase().replace('.', '');
        };

        const calculateDaysUntil = (dateString: string | null) => {
          if (!dateString) return 0;
          const targetDate = new Date(dateString);
          const today = new Date();
          const diffTime = targetDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return Math.max(0, diffDays);
        };

        setStats({
          certificatesCount: certificatesCount || 0,
          companiesCount: 0
        });

        if (bannerData) {
          setActiveBanner({
            message: bannerData.message,
            icon: bannerData.icon,
            daysUntilStart: calculateDaysUntil(bannerData.data_imersao),
            formattedDate: formatDate(bannerData.data_imersao)
          });
        }
      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, activeBanner, loading, error };
}