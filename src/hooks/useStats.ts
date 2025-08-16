import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  certificatesCount: number;
  companiesCount: number;
}

interface ActiveBanner {
  message: string;
  icon: string;
  daysUntilStart: number;
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
          .select('message, icon')
          .eq('is_active', true)
          .single();

        if (bannerError && bannerError.code !== 'PGRST116') {
          console.error('Erro ao buscar banner:', bannerError);
        }

        // Calcular dias até 03 de setembro
        const targetDate = new Date('2024-09-03');
        const today = new Date();
        const diffTime = targetDate.getTime() - today.getTime();
        const daysUntilStart = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setStats({
          certificatesCount: certificatesCount || 0,
          companiesCount: 0
        });

        if (bannerData) {
          setActiveBanner({
            message: bannerData.message,
            icon: bannerData.icon,
            daysUntilStart: Math.max(0, daysUntilStart)
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