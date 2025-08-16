import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Local {
  id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  empresa_id: string;
}

export const useLocais = () => {
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocais = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('locais')
          .select('*')
          .eq('status', 'ativo')
          .order('nome', { ascending: true });

        if (error) {
          throw error;
        }

        setLocais(data || []);
      } catch (err) {
        console.error('Error fetching locais:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar locais');
      } finally {
        setLoading(false);
      }
    };

    fetchLocais();
  }, []);

  return { locais, loading, error };
};