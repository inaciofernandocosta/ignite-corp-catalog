import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  certificatesCount: number;
  companiesCount: number;
}

export function useStats() {
  const [stats, setStats] = useState<Stats>({ certificatesCount: 0, companiesCount: 0 });
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

        // Buscar quantidade de empresas únicas nas inscrições
        const { data: companiesData, error: companiesError } = await supabase
          .from('inscricoes_mentoria')
          .select('empresa', { head: false })
          .not('empresa', 'is', null);

        if (companiesError) {
          console.error('Erro ao buscar empresas:', companiesError);
          throw companiesError;
        }

        // Contar empresas únicas
        const uniqueCompanies = new Set(
          companiesData?.map(item => item.empresa?.trim().toLowerCase()).filter(Boolean) || []
        );

        setStats({
          certificatesCount: certificatesCount || 0,
          companiesCount: uniqueCompanies.size
        });
      } catch (err) {
        console.error('Erro ao carregar estatísticas:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}